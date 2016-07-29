package api

import (
	"appengine"
	"appengine/urlfetch"
	"encoding/json"
	"fmt"
	"geoip2"
	"github.com/gorilla/mux"
	"github.com/lionelbarrow/braintree-go"
	"github.com/microcosm-cc/bluemonday"
	"io/ioutil"
	"net"
	"net/http"
	"os"
	"strings"
)

type HandlerArgs struct {
	Context appengine.Context
	Request *http.Request
	Writer  http.ResponseWriter
	Vars    map[string]string
}
type Handler func(HandlerArgs) (interface{}, int)
type Handlers map[string]Handler

type none struct{}

var methods = struct {
	GET     string
	HEAD    string
	POST    string
	PUT     string
	DELETE  string
	TRACE   string
	OPTIONS string
	CONNECT string
}{
	"GET",
	"HEAD",
	"POST",
	"PUT",
	"DELETE",
	"TRACE",
	"OPTIONS",
	"CONNECT",
}

var empty = struct{}{}

var router = mux.NewRouter()
var isRouterActive = false

var sanitizer = bluemonday.StrictPolicy()

var countrydb, _ = geoip2.Open("GeoIP2-Country.mmdb")
var orgdb, _ = geoip2.Open("GeoIP2-ISP.mmdb")

var twilioSID = os.Getenv("TWILIO_SID")
var twilioAuthToken = os.Getenv("TWILIO_AUTH_TOKEN")

var braintreeMerchantID = os.Getenv("BRAINTREE_MERCHANT_ID")
var braintreePublicKey = os.Getenv("BRAINTREE_PUBLIC_KEY")
var braintreePrivateKey = os.Getenv("BRAINTREE_PRIVATE_KEY")

var prefineryKey = os.Getenv("PREFINERY_KEY")

func geolocate(h HandlerArgs) (string, string) {
	record, err := countrydb.Country(net.ParseIP(h.Request.RemoteAddr))
	if err != nil {
		return "", config.DefaultContinent
	}

	country := strings.ToLower(record.Country.IsoCode)
	continent := strings.ToLower(record.Continent.Code)

	if _, ok := config.Continents[continent]; !ok {
		continent = config.DefaultContinent
	}

	return country, continent
}

func getSignupFromRequest(h HandlerArgs) map[string]interface{} {
	country, _ := geolocate(h)

	signup := make(map[string]interface{})
	profile := make(map[string]interface{})

	profile["country"] = country
	profile["first_name"] = sanitize(h.Request.PostFormValue("name"), config.MaxSignupValueLength)
	profile["http_referrer"] = sanitize(h.Request.Referer(), config.MaxSignupValueLength)
	profile["locale"] = sanitize(h.Request.PostFormValue("language"), config.MaxSignupValueLength)
	profile["custom_var1"] = sanitize(h.Request.PostFormValue("inviteCode"), config.MaxSignupValueLength)
	signup["email"] = sanitize(strings.ToLower(h.Request.PostFormValue("email")), config.MaxSignupValueLength)
	signup["profile"] = profile

	return signup
}

func getOrg(h HandlerArgs) string {
	record, err := orgdb.ISP(net.ParseIP(h.Request.RemoteAddr))
	if err != nil {
		return ""
	}

	return record.Organization
}

func braintreeInit(h HandlerArgs) *braintree.Braintree {
	env := braintree.Sandbox

	if config.IsProd {
		env = braintree.Production
	}

	bt := braintree.New(
		env,
		braintreeMerchantID,
		braintreePublicKey,
		braintreePrivateKey,
	)

	bt.SetHTTPClient(urlfetch.Client(h.Context))

	return bt
}

func getTwilioToken(h HandlerArgs) map[string]interface{} {
	client := urlfetch.Client(h.Context)

	req, _ := http.NewRequest(
		methods.POST,
		"https://api.twilio.com/2010-04-01/Accounts/"+twilioSID+"/Tokens.json",
		nil,
	)
	req.SetBasicAuth(twilioSID, twilioAuthToken)
	resp, err := client.Do(req)

	if err == nil {
		body, err := ioutil.ReadAll(resp.Body)

		if err == nil {
			var token map[string]interface{}
			err := json.Unmarshal(body, &token)

			if err == nil {
				return token
			} else {
				return getTwilioToken(h)
			}
		} else {
			return getTwilioToken(h)
		}
	} else {
		return getTwilioToken(h)
	}
}

func handleFunc(pattern string, handler Handler) {
	handleFuncs(pattern, Handlers{methods.GET: handler})
}

func handleFuncs(pattern string, handlers Handlers) {
	if !isRouterActive {
		http.Handle("/", router)

		isRouterActive = true
	}

	router.HandleFunc(pattern, func(w http.ResponseWriter, r *http.Request) {
		var method string
		if m, ok := r.Header["Access-Control-Request-Method"]; ok && len(m) > 0 {
			method = m[0]
		} else {
			method = r.Method
		}

		if handler, ok := handlers[method]; ok {
			initHandler(w, r)

			responseBody, responseCode := handler(HandlerArgs{appengine.NewContext(r), r, w, mux.Vars(r)})

			w.WriteHeader(responseCode)

			if responseBody != nil {
				output := ""

				if s, ok := responseBody.(string); ok {
					output = s
				} else if b, err := json.Marshal(responseBody); err == nil {
					output = string(b)
					w.Header().Set("Content-Type", "application/json")
				}

				fmt.Fprint(w, output)
			}
		} else {
			w.WriteHeader(http.StatusMethodNotAllowed)
		}
	})
}

func initHandler(w http.ResponseWriter, r *http.Request) {
	origin := r.Header.Get("Origin")
	host := strings.Split(origin, "/")[2]

	if _, ok := config.AllowedHosts[host]; ok || appengine.IsDevAppServer() {
		w.Header().Add("Access-Control-Allow-Origin", origin)
		w.Header().Add("Access-Control-Allow-Credentials", "true")
		w.Header().Add("Access-Control-Allow-Methods", config.AllowedMethods)
		w.Header().Set("Public-Key-Pins", config.HPKPHeader)
		w.Header().Set("Strict-Transport-Security", config.HSTSHeader)
	}
}

func nullHandler(h HandlerArgs) (interface{}, int) {
	return nil, http.StatusOK
}

func sanitize(s string, params ...int) string {
	sanitized := sanitizer.Sanitize(s)

	maxLength := -1
	if len(params) > 0 {
		maxLength = params[0]
	}

	if maxLength > -1 && len(sanitized) > maxLength {
		return sanitized[:maxLength]
	} else {
		return sanitized
	}
}
