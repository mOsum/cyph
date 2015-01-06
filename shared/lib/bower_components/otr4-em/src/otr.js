/** @module otr */
(function () {
    "user strict";
    /*
     *  Off-the-Record Messaging bindings for node/javascript
     *  Copyright (C) 2012  Mokhtar Naamani,
     *                      <mokhtar.naamani@gmail.com>
     *
     *  This program is free software; you can redistribute it and/or modify
     *  it under the terms of version 2 of the GNU General Public License as
     *  published by the Free Software Foundation.
     *
     *  This program is distributed in the hope that it will be useful,
     *  but WITHOUT ANY WARRANTY; without even the implied warranty of
     *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
     *  GNU General Public License for more details.
     *
     *  You should have received a copy of the GNU General Public License
     *  along with this program; if not, write to the Free Software
     *  Foundation, Inc., 59 Temple Place, Suite 330, Boston, MA  02111-1307  USA
     */
    var root = this,
        otr, OTRBindings, util, events, nextTick;

    var inBrowser = false;

    /** The available values used for the policy parameter of an otr Session()
     *
     *  @alias module:otr.POLICY
     *  @readonly
     *  @enum {number}
     */
    var POLICY = {
        'NEVER': 0x00,
        'ALLOW_V1': 0x01,
        'ALLOW_V2': 0x02,
        'ALLOW_V3': 0x04,
        'REQUIRE_ENCRYPTION': 0x08,
        'SEND_WHITESPACE_TAG': 0x10,
        'WHITESPACE_START_AKE': 0x20,
        'ERROR_START_AKE': 0x40,
        /** ALLOW_V1 | ALLOW_V2 | ALLOW_V3 */
        'VERSION_MASK': 0x01 | 0x02 | 0x04,
        /** VERSION_MASK | SEND_WHITESPACE_TAG | WHITESPACE_START_AKE | ERROR_START_AKE */
        'OPPORTUNISTIC': 0x01 | 0x02 | 0x04 | 0x10 | 0x20 | 0x40,
        /** VERSION_MASK */
        'MANUAL': 0x01 | 0x02 | 0x04,
        /** VERSION_MASK | REQUIRE_ENCRYPTION | WHITESPACE_START_AKE | ERROR_START_AKE */
        'ALWAYS': 0x01 | 0x02 | 0x04 | 0x08 | 0x20 | 0x40,
        /** OPPORTUNISTIC */
        'DEFAULT': 0x01 | 0x02 | 0x04 | 0x10 | 0x20 | 0x40
    };

    var MSGEVENT_ARRAY = ["NONE", "ENCRYPTION_REQUIRED", "ENCRYPTION_ERROR", "CONNECTION_ENDED", "SETUP_ERROR",
        "MSG_REFLECTED", "MSG_RESENT", "RCVDMSG_NOT_IN_PRIVATE", "RCVDMSG_UNREADABLE", "RCVDMSG_MALFORMED",
        "LOG_HEARTBEAT_RCVD", "LOG_HEARTBEAT_SENT", "RCVDMSG_GENERAL_ERR", "RCVDMSG_UNENCRYPTED",
        "RCVDMSG_UNRECOGNIZED", "RCVDMSG_FOR_OTHER_INSTANCE"
    ];

    /** The 'value' property of "msg_event" events emitted by a Session()
     *
     *  @alias module:otr.MSGEVENT
     *  @readonly
     *  @enum {number}
     */
    var MSGEVENT = {
        /** 0 */
        "NONE": 0,
        /** 1 - Our policy requires encryption but we are trying to send
         *      an unencrypted message out. */
        "ENCRYPTION_REQUIRED": 1,
        /** 2 - An error occured while encrypting a message and the message
         *      was not sent. */
        "ENCRYPTION_ERROR": 2,
        /** 3 - Message has not been sent because our contact has ended the
         *      private conversation. We should either end the connection,
         *      or refresh it. */
        "CONNECTION_ENDED": 3,
        /** 4 - A private conversation could not be set up. A gcry_error_t
         *      will be passed. */
        "SETUP_ERROR": 4,
        /** 5 - Received our own OTR messages. */
        "MSG_REFLECTED": 5,
        /** 6 - The previous message was resent. */
        "MSG_RESENT": 6,
        /** 7 - Received an encrypted message but cannot read
         *      it because no private connection is established yet. */
        "RCVDMSG_NOT_IN_PRIVATE": 7,
        /** 8 - Cannot read the received message. */
        "RCVDMSG_UNREADABLE": 8,
        /** 9 - The message received contains malformed data. */
        "RCVDMSG_MALFORMED": 9,
        /** 10 - Received a heartbeat. */
        "LOG_HEARTBEAT_RCVD": 10,
        /** 11 - Sent a heartbeat. */
        "LOG_HEARTBEAT_SENT": 11,
        /** 12 - Received a general OTR error. The argument 'message' will
         *       also be passed and it will contain the OTR error message. */
        "RCVDMSG_GENERAL_ERR": 12,
        /** 13 - Received an unencrypted message. The argument 'message' will
         *       also be passed and it will contain the plaintext message. */
        "RCVDMSG_UNENCRYPTED": 13,
        /** 14 - Cannot recognize the type of OTR message received. */
        "RCVDMSG_UNRECOGNIZED": 14,
        /** 15 - Received and discarded a message intended for another instance. */
        "RCVDMSG_FOR_OTHER_INSTANCE": 15,

        /** method to convert MSGEVENT number to string
         * @type {function}
         */
        name: function (n) {
            return MSGEVENT_ARRAY[n];
        }
    };

    /* make an object returned as the first argument in the msg_event event emitted by Session */
    function msgEvent(val, message, error) {
        return ({
            value: val,
            name: MSGEVENT.name(val),
            message: message,
            error: error
        });
    }

    if (typeof exports !== 'undefined') {

        OTRBindings = require("./bindings.js");
        util = require('util');
        events = require('events');
        otr = new OTRBindings();
        if (otr.version() !== "4.1.0-emscripten") {
            console.error("Error. excpecting libotr4.1.0-emscripten! exiting..");
            process.exit();
        }

        util.inherits(Session, events.EventEmitter);

        module.exports = {
            /** @method
             *  @returns {String} libotr version information
             */
            version: otr.version,
            User: User,
            Account: Account,
            Contact: Contact,
            Session: Session,
            POLICY: POLICY,
            MSGEVENT: MSGEVENT
        };

        nextTick = function (func) {
            setTimeout(func, 0);
        };

    } else {
        inBrowser = true;
        OTRBindings = root.OTRBindings;
        events = undefined;
        otr = new OTRBindings();
        if (otr.version() != "4.1.0-emscripten") {
            alert("Warning. Excpecting libotr4.1.0-emscripten! OTR library not loaded.");
        } else {
            root.OTR = {
                version: otr.version,
                User: User,
                Account: Account,
                Contact: Contact,
                Session: Session,
                POLICY: POLICY,
                MSGEVENT: MSGEVENT
            };
        }
        nextTick = function (func) {
            setTimeout(func, 0);
        };
    }

    /* returns the path replacing the ~ if it appears with the home directory of the user */
    function expandHomeDir(path) {
        if (inBrowser) return path;
        var USER_HOME = process.env[(process.platform == 'win32') ? 'USERPROFILE' : 'HOME'];
        if (path && path[0] === '~') {
            //expand home directory
            return path.replace("~", USER_HOME);
        }
        return path;
    }

    /** Represents a users's keys, fingerprints and instance tags
     *  stored in files on the virtual file system. Passing in the optional files argument to
     *  the constructor will load the the keystore files (keys, fingerprints and instags) automatically, using
     *  the loadKeysFromFS, loadFingerprintsFromFS and loadInstagsFromFS methods.
     *  @alias module:otr.User
     *  @constructor
     *  @param {Object} [files] object with string properties: keys, fingerprints, instags
     */
    function User(files) {
        this.state = new otr.UserState();
        this.keys = otr.VFS.nextFileName();
        this.fingerprints = otr.VFS.nextFileName();
        this.instags = otr.VFS.nextFileName();

        //load files from the real file system
        if (files) {
            if (files.keys) {
                try {
                    this.loadKeysFromFS(files.keys);
                } catch (e) {
                    console.error("Warning Reading Keys:", e);
                }
            }
            if (files.fingerprints) {
                try {
                    this.loadFingerprintsFromFS(files.fingerprints);
                } catch (e) {
                    console.error("Warning Reading Fingerprints:", e);
                }
            }
            if (files.instags) {
                try {
                    this.loadInstagsFromFS(files.instags);
                } catch (e) {
                    console.error("Warning Reading Instags:", e);
                }
            }
        }
    }

    /** Reads a file from filesystem, imports it into the the internal virtual file system and
	  * parses it to load private keys.
	  * @method
	  * @param {string} filename - path to private keys file.
	  * @param {Function} [transform] - function thats takes a Buffer as its only argument and returns a Buffer.
	       The returned buffer will be stored in the imported file. (This could be used to decrypt a file, or transform it from a different format)
	       If no function is provided the the file is imported as is.
	  * @throws {Error}
	  * @throws {TypeError}
	  */
    User.prototype.loadKeysFromFS = function (filename, transform) {
        otr.VFS.importFile(expandHomeDir(filename), this.keys, transform);
        this.state.readKeysSync(this.keys);
    };

    /** Reads a file from filesystem, imports it into the the internal virtual file system and
	* parses it to load fingerprints.
	* @method
	* @param {string} filename - path to fingerprints file.
	* @param {Function} [transform] - function thats takes a Buffer as its only argument and returns a Buffer.
	The returned buffer will be stored in the imported file. (This could be used to decrypt a file, or transform it from a different format)
	If no function is provided the the file is imported as is.
	* @throws {Error}
	* @throws {TypeError}
	*/
    User.prototype.loadFingerprintsFromFS = function (filename, transform) {
        otr.VFS.importFile(expandHomeDir(filename), this.fingerprints, transform);
        this.state.readFingerprintsSync(this.fingerprints);
    };

    /** Reads a file from filesystem, imports it into the the internal virtual file system and
	* parses it to load instags.
	* @method
	* @param {string} filename - path to instags file.
	* @param {Function} [transform] - function thats takes a Buffer as its only argument and returns a Buffer.
	The returned buffer will be stored in the imported file. (This could be used to decrypt a file, or transform it from a different format)
	If no function is provided the the file is imported as is.
	* @throws {Error}
	* @throws {TypeError}
	*/
    User.prototype.loadInstagsFromFS = function (filename, transform) {
        otr.VFS.importFile(expandHomeDir(filename), this.instags, transform);
        this.state.readInstagsSync(this.instags);
    };

    /** Deletes the keystore files from the virtual file system.
     * @method
     */
    User.prototype.deleteVfsFiles = function () {
        otr.VFS.deleteFile(this.keys);
        otr.VFS.deleteFile(this.instags);
        otr.VFS.deleteFile(this.fingerprints);
    };

    /** Saves the keys file from the internal virtual file system back to the real file system.
	* @method
	* @param {string} filename - destination path to save private keys file.
	* @param {Function} [transform] - function thats takes a Buffer as its only argument and returns a Buffer.
	The returned buffer will be saved to the file system. (This could be used to encrypt a file, or transform it to a different format)
	* @throws {Error}
	* @throws {TypeError}
	*/
    User.prototype.saveKeysToFS = function (filename, transform) {
        otr.VFS.exportFile(this.keys, expandHomeDir(filename), transform);
    };

    /** Saves the fingerprints file from the internal virtual file system back to the real file system.
	* @method
	* @param {string} filename - destination path to save fingerprints file.
	* @param {Function} [transform] - function thats takes a Buffer as its only argument and returns a Buffer.
	The returned buffer will be saved to the file system. (This could be used to encrypt a file, or transform it to a different format)
	* @throws {Error}
	* @throws {TypeError}
	*/
    User.prototype.saveFingerprintsToFS = function (filename, transform) {
        otr.VFS.exportFile(this.fingerprints, expandHomeDir(filename), transform);
    };

    /** Saves the instags file from the internal virtual file system back to the real file system.
	* @method
	* @param {string} filename - destination path to save instags file.
	* @param {Function} [transform] - function thats takes a Buffer as its only argument and returns a Buffer.
	The returned buffer will be saved to the file system. (This could be used to encrypt a file, or transform it to a different format)
	* @throws {Error}
	* @throws {TypeError}
	*/
    User.prototype.saveInstagsToFS = function (filename, transform) {
        otr.VFS.exportFile(this.instags, expandHomeDir(filename), transform);
    };

    /**
     * Reads the keys file from the virtual file system and returns it as a string. This can be useful in a web
     * environment for persisting the account data.
     * @method
     * @returns {string}
     * @throws {Error}
     * @throws {TypeError}
     */
    User.prototype.keysToString = function () {
        return otr.VFS.readFileData(this.keys).toString();
    };

    /**
     * Reads the fingerprints file from the virtual file system and returns it as a string. This can be useful in a web
     * environment for persisting the account data.
     * @method
     * @returns {string}
     * @throws {Error}
     * @throws {TypeError}
     */
    User.prototype.fingerprintsToString = function () {
        return otr.VFS.readFileData(this.fingerprints).toString();
    };

    /**
     * Reads the instags file from the virtual file system and returns it as a string. This can be useful in a web
     * environment for persisting the account data.
     * @method
     * @returns {string}
     * @throws {Error}
     * @throws {TypeError}
     */
    User.prototype.instagsToString = function () {
        return otr.VFS.readFileData(this.instags).toString();
    };

    /**
     * Creates the keys file on the virtual file system from a string.
     * @method
     * @param {string} data - keys data in libotr format
     * @throws {Error}
     * @throws {TypeError}
     */
    User.prototype.stringToKeys = function (str) {
        otr.VFS.makeFile(this.keys, new Buffer(str));
        this.state.readKeysSync(this.keys);
    };

    /**
     * Creates the fingerprints file on the virtual file system from a string.
     * @method
     * @param {string} data - fingerprints data in libotr format
     * @throws {Error}
     * @throws {TypeError}
     */
    User.prototype.stringToFingerprints = function (str) {
        otr.VFS.makeFile(this.fingerprints, new Buffer(str));
        this.state.readFingerprintsSync(this.fingerprints);
    };

    /**
     * Creates the instags file on the virtual file system from a string.
     * @method
     * @param {string} data - instags data in libotr format
     * @throws {Error}
     * @throws {TypeError}
     */
    User.prototype.stringToInstags = function (str) {
        otr.VFS.makeFile(this.instags, new Buffer(str));
        this.state.readInstagsSync(this.instags);
    };

    /**
     * Returns and array of {@link module:otr.Account Account} instances, representing all the user accounts.
     * If no accounts exist, the return value will be an empty array.
     * @method
     * @returns {Array} Array of {@link module:otr.Account Account} instances.
     */
    User.prototype.accounts = function () {
        var user = this,
            accounts = this.state.accounts(),
            list = [];
        accounts.forEach(function (account) {
            list.push(new Account(user, account.accountname, account.protocol));
        });
        return list;
    };

    /**
     * Writes fingerprints from memory to the virtual fingerprints file. Use this method to save new fingerprints
     * and when they get marked as trusted following SMP authentication. You will still need to persist the file to
     * real file system or elswehere using fingerprintsToString or saveFingerprintsToFS methods.
     * @method
     * @throws {Error}
     * @throws {TypeError}
     */
    User.prototype.writeFingerprints = function () {
        this.state.writeFingerprintsSync(this.fingerprints);
    };

    /**
     * Writes only fingerprints which have been authenticated from memory to the virtual fingerprints file.
     * You will still need to persist the file to real file system or elswehere using fingerprintsToString
     * or saveFingerprintsToFS methods.
     * @method
     * @throws {Error}
     * @throws {TypeError}
     */
    User.prototype.writeTrustedFingerprints = function () {
        this.state.writeTrustedFingerprintsSync(this.fingerprints);
    };

    User.prototype.getMessagePollDefaultInterval = function () {
        return this.state.getMessagePollDefaultInterval();
    };

    User.prototype.messagePoll = function (ops, opdata) {
        this.state.messagePoll(ops, opdata);
    };

    /**
     * Select an account or create a new account with given accountname and protocol
     * @method
     * @argument {string}  accountname
     * @argument {string}  protocol
     * @returns  {Account} instance of {@link module:otr.Account Account} class
     */
    User.prototype.account = function (accountname, protocol) {
        return new Account(this, accountname, protocol);
    };

    /** Represents a single user account.
     * @alias module:otr.Account
     * @constructor
     * @argument {User} user - {@link module:otr.User User} object to associate the account with
     * @argument {string} accountname
     * @argument {string} protocol
     */
    function Account(user, accountname, protocol) {
        if (!(user instanceof User)) {
            throw new TypeError("first argument must be an instance of User");
        }

        if (typeof accountname !== 'string') {
            throw new TypeError("second argument must be a string");
        }

        if (typeof protocol !== 'string') {
            throw new TypeError("third argument must be a string");
        }

        var account = this;

        /**
         * Getter for the accountname of the account.
         * @method
         * @returns {string} The accountname.
         */
        this.name = function () {
            return accountname;
        };

        /**
         * Getter for the protocol of the account.
         * @method
         * @returns {string} The protocol.
         */
        this.protocol = function () {
            return protocol;
        };

        /**
         * Generates a new OTR key for the account. Will replace current key if it exists.
         * @method
         * @argument {module:otr.Account~generateKey_Callback} callback
         */
        this.generateKey = function (callback) {
            user.state.generateKey(user.keys, accountname, protocol, function (err, key) {
                if (callback) {
                    callback.apply(account, [err, key ? key.export() : undefined]);
                }
            });
        };

        /** Deletes OTR key of the account.
         * @method
         */
        this.deleteKey = function () {
            user.state.deleteKeyOnFile(user.keys, accountname, protocol);
        };

        /** Returns the OTR key of the account.
         * @method
         * @returns {PrivKey} in base 16 (hexadecimal)
         */
        this.exportKey = function () {
            var key = user.state.findKey(accountname, protocol);
            if (key) return key.export();
            return undefined;
        };

        /* Returns the OTR key fingerprint in human readable format.
         * @method
         * @returns {string}
         */
        this.fingerprint = function () {
            return user.state.fingerprint(accountname, protocol);
        };

        /** Imports and replaces the OTR key of the account.
         * @method
         * @argument {PrivKey} key
         * @argument {number} [base] - decimal representation of components of key. Default 16 (hexadecimal)
         * @throws {Error} If key import fails.
         */
        this.importKey = function (key, base) {
            user.state.importKey(accountname, protocol, key, base);
            user.state.writeKeysSync(user.keys);
        };

        /** Generates a new instance tag for the account.
         * @method
         * @argument {module:otr.Account~generateInstag_Callback} callback
         */
        this.generateInstag = function (callback) {
            try {
                user.state.generateInstag(user.instags, accountname, protocol);
                if (typeof callback === 'function') {
                    callback(undefined, user.state.findInstag(accountname, protocol));
                }
            } catch (e) {
                if (typeof callback === 'function') {
                    callback(e, undefined);
                }
            }
        };

        /** Getter for instance tag of account.
         * @method
         * @returns {number} Instance tag
         */
        this.instag = function () {
            return user.state.findInstag(accountname, protocol);
        };

        /** Creates and instance of {@link module:otr.Contact Contact}.
         * @method
         * @argument {string} recipient - Name of recipient/contact
         * @returns {Contact} instance of {@link module:otr.Contact Contact}
         */
        this.contact = function (name) {
            return new Contact(user, account, name);
        };

        /** Returns an array of Contact instances, representing all contacts
         * @method
         * @returns {array} of Contact instances
         */
        this.contacts = function () {
            var contexts = user.state.masterContexts(),
                contacts = [];
            contexts.forEach(function (context) {
                if (context.their_instance() !== 0) {
                    return;
                }
                contacts.push(new Contact(user, account, context.username()));
            });
            return contacts;
        };

        /**
         * @callback module:otr.Account~generateKey_Callback
         * @param {Error} err - If there was an error generating the key
         * @param {PrivKey} key - If key was successfully generated, undefined otherwise.
         */

        /**
         * @callback module:otr.Account~generateInstag_Callback
         * @param {Error} err - If there was an error generating the instance tag
         * @param {number} instag - If instag was successfully generated, undefined otherwise.
         */

        /**
         * An OTR key is a DSA key. This object stores the values of the components that make up the private and
         * public key. It is provided as a means to easily export and import a key into an Account. It is returned
         * in the callback supplied to generateKey method and  returned by the exportKey method of an Account instance.
         * @typedef {Object} PrivKey
         * @property {string} p - p
         * @property {string} q - q
         * @property {string} g - g
         * @property {string} y - y
         * @property {string} x - x
         */
    }

    /** Contact
     * @constructor
     * @alias module:otr.Contact
     * @argument {User} user - instance of {@link module:otr.User User}
     * @argument {Account} account - instance of {@link module:otr.Account Account}
     * @argument {string} name - name of the contact
     */
    function Contact(user, account, name) {
        if (!(user instanceof User)) {
            throw new TypeError("first argument must be an instance of User");
        }
        if (!(account instanceof Account)) {
            throw new TypeError("second argument must be an instance of Account");
        }
        if (typeof name !== 'string') {
            throw new TypeError("third argument must be a string");
        }

        /** Getter for name of contact
         * @method
         * @returns {string} contact name
         */
        this.name = function () {
            return name;
        };

        /** Returns an array of knwon Fingerprint instances for this contact.
         * @method
         * @returns {array} Array of Fingerprint instances.
         */
        this.fingerprints = function () {
            var context = new otr.ConnContext(user.state, account.name(), account.protocol(), name);
            return context.masterFingerprints();
        };

        /** Setup an OTR session with the contact.
         * @method
         * @argument {Object} [parameters]
         * @returns {Session}
         */
        this.openSession = function (parameters) {
            return new Session(user, account, this, parameters);
        };

    }

    var nextSessionID = (function () {
        var COUNTER = 0;
        return (function () {
            COUNTER = COUNTER + 1;
            return COUNTER;
        });
    })();

    /** Session class is an EventEmitter, that handles the OTR protocol.
     * You can optionally add an online() method to the instance which should return true if contact is online.
     * This determines wether to send hearbeats or not. If method is not added contact is assumed to be online.
     * @constructor
     * @alias module:otr.Session
     * @param {User} user -
     * @param {Account} account -
     * @param {Contact} contact -
     * @param {OTRParams} [parameters] -
     */
    function Session(user, account, contact, parameters) {
        var session = this;
        session._id = nextSessionID();

        if (events) {
            events.EventEmitter.call(this);
        } else {
            this._events = {};
        }
        session.user = user;
        session.context = new otr.ConnContext(user.state, account.name(), account.protocol(), contact.name());
        session.parameters = parameters;
        session.ops = new otr.MessageAppOps(
            function (o) {
                if (parameters && parameters.debug) {
                    console.error(o);
                }
                switch (o.EVENT) {
                    /**
                     * "smp" Session event, combines multiple smp event types
                     *
                     * @event module:otr.Session#smp
                     * @type {function}
                     * @param {string} type - one of "failed", "request","complete", "aborted"
                     * @param {string} [question] - if an smp request came with a question
                     */
                case "smp_error":
                    session.smpAbort();
                    session.emit("smp", "failed");
                    return;
                case "smp_request":
                    session.emit("smp", "request", o.question);
                    return;
                case "smp_complete":
                    session.emit("smp", "complete");
                    return;
                case "smp_failed":
                    session.emit("smp", "failed");
                    return;
                case "smp_aborted":
                    session.emit("smp", "aborted");
                    return;

                case "is_logged_in":
                    if (typeof session.online === 'function') {
                        if (session.online()) return 1;
                        return 0;
                    }
                    return 1; //remote party is assumed to be online

                case "gone_secure":
                    /** "gone_secure" Session event, is called when connection becomes encrypted
                     * @event module:otr.Session#gone_secure
                     */
                    session.emit(o.EVENT);
                    return;

                case "gone_insecure":
                    //never get's called by libotr4.0.0?
                    session.emit(o.EVENT);
                    return;

                case "policy":
                    if (!session.parameters) {
                        return POLICY.DEFAULT;
                    }
                    if (typeof session.parameters.policy === 'number') {
                        return (session.parameters.policy); //todo: validate policy
                    }
                    return POLICY.DEFAULT;

                case "max_message_size":
                    if (!session.parameters) return 0;
                    return session.parameters.MTU || 0;

                case "inject_message":
                    /** "inject_message" Session event, is fired when a message fragment should be sent to contact
                     * @event module:otr.Session#inject_message
                     * @type {function}
                     * @param {string} message - message fragment to be sent.
                     */
                    if (!session.listeners(o.EVENT).length) {
                        console.error("no listeners for inject_message event");
                    }
                    session.emit(o.EVENT, o.message);
                    return;

                case "new_fingerprint":
                    /** "new_fingerprint" Session event is fired when we see a fingerprint not on file.
                     * This is fired before gone_secure event and will be followed by write_fingerprints event.
                     * @event module:otr.Session#new_fingerprint
                     * @type {function}
                     * @param {string} fingerprint
                     */
                    session.emit(o.EVENT, o.fingerprint);
                    return;

                case "write_fingerprints":
                    /** "write_fingerprints" Session event is fired when a new fingerprint is seen and when a fingerprint is
                     * successfully authenticated with SMP
                     * @event module:otr.Session#write_fingerprints
                     */
                    session.emit(o.EVENT);
                    return;

                case "still_secure":
                    /** "still_secure" Session event is fired when otr session is re-negotiated.
                     * @event module:otr.Session#still_secure
                     */
                    session.emit(o.EVENT);
                    return;

                case "msg_event":
                    /** "msg_event" Session event is fired when some type of exceptional event has occured
					     that your application may want to be aware of. Your application may want
					     to write an event to a log file, display a message to the user, or
					     ignore the event.  While it is not required to implement this operation,
					     it is probably a good idea.
					  * @event module:otr.Session#msg_event
					  * @type {function}
					  * @param {Object} msgevent - properties value (otr.MSGEVENT),name,message,error
					  */
                    session.emit(o.EVENT, msgEvent(o.event, o.message, o.err));
                    return;

                case "received_symkey":
                    /** "received_symkey" Session event is fired when contact has decided to use the extra symmetric key
                     * @event module:otr.Session#received_symkey
                     * @type {function}
                     * @param {number} use
                     * @param {ArrayBuffer} usedata
                     * @param {ArrayBuffer} key
                     */
                    session.emit(o.EVENT, o.use, o.usedata, o.key);
                    return;

                case "remote_disconnected":
                    /** "disconnect" Session event is fired when contact ends the private conversation. The session will be in Finished state.
                     * @event module:otr.Session#disconnect
                     */
                    session.emit("disconnect");
                    return;

                case "update_context_list":
                    /** "update_context_list" Session event is fired when contacts are added or removed.
                     * @event module:otr.Session#update_context_list
                     */
                    session.emit(o.EVENT);
                    return;

                case "create_privkey":
                    /** "create_privkey" Session event will be raised if an OTR conversation was attempted an the account does not have an OTR key.
                     * It is a good practice to make sure a private key is generated before starting a session.
                     * @event module:otr.Session#create_privkey
                     */
                    if (!session.listeners(o.EVENT).length) {
                        console.error("no listeners for create_privkey event");
                    }
                    session.emit(o.EVENT, o.accountname, o.protocol);
                    return;

                case "create_instag":
                    if (!session.listeners(o.EVENT).length) {
                        console.error("no listeners for create_instag event");
                    }
                    /** "create_instag" Session event will be raised if an OTR conversation was attempted an the account does not have an instance tag.
                     * It is a good practice to make sure an instance tag is generated before starting a session.
                     * @event module:otr.Session#create_instag
                     */
                    session.emit(o.EVENT, o.accountname, o.protocol);
                    return;
                }
            }

        );

        this.message_poll_interval = setInterval(function () {
            user.messagePoll(session.ops, 0);
        }, user.getMessagePollDefaultInterval() * 1000 || 70 * 1000);
    }

    /** Sends the OTR query message to start the OTR protocol.
     * @method
     */
    Session.prototype.start = function () {
        return this.send("?OTR?");
    };

    /** Send a message to contact
     * @method
     * @param {string} message - a string or object with a toString() method
     * @param {number} instag - instance tag of contact if known.
     */
    Session.prototype.send = function (message, instag) {
        var session = this;
        nextTick(function () {
            instag = instag || 1; //default instag = BEST
            //message can be any object that can be serialsed to a string using it's .toString() method.
            var msgout = session.ops.messageSending(session.user.state, session.context.accountname(),
                session.context
                .protocol(),
                session.context.username(), message.toString(), instag, session);
            if (msgout) {
                //frag policy something other than SEND_ALL.. results in a fragment to be sent manually
                session.emit("inject_message", msgout);
            }
        });
    };

    /** Pass incoming data/messages from contact to this method to be handled by OTR
     * @method
     * @param {string} message - a string or object with a toString() method
     */
    Session.prototype.recv = function (message) {
        var session = this;
        nextTick(function () {
            //message can be any object that can be serialsed to a string using it's .toString() method.
            var msg = session.ops.messageReceiving(session.user.state, session.context.accountname(),
                session.context
                .protocol(),
                session.context.username(), message.toString(), session);
            if (msg) {
                /** "message" Session event is fired when receiving a plaintext or decrypted message from contact
                 * @event module:otr.Session#message
                 * @type {function}
                 * @param {string} message
                 * @param {boolean} isEncrypted - true if message was received in private
                 */
                session.emit("message", msg, session.isEncrypted());
            }
        });
    };

    /** Ends an OTR conversation and returns to plaintext.
     * @method
     */
    Session.prototype.end = function () {
        var session = this;
        nextTick(function () {
            if (session.message_poll_interval) {
                clearInterval(session.message_poll_interval);
            }
            session.ops.disconnect(session.user.state, session.context.accountname(), session.context.protocol(),
                session.context.username(),
                session.context.their_instance());
            nextTick(function () {
                /** "plaintext" Session event is fired after ending our side of the private conversation and returning to
                 * plaintext mode.
                 * @event module:otr.Session#plaintext
                 */
                session.emit("plaintext");
            });
        });
    };

    /** Starts SMP authentication
     * @method
     * @param {string} [secret] - secret to use for authentication. If not provided it will be taken from session parameters.
     * @throws {Error}
     */
    Session.prototype.smpStart = function (secret) {
        var session = this;
        var sec = secret;
        sec = sec || (this.parameters ? this.parameters.secret : undefined);
        if (sec) {
            nextTick(function () {
                session.ops.initSMP(session.user.state, session.context, sec);
            });
        } else {
            throw (new Error("No Secret Provided"));
        }
    };

    /** Starts SMP authentication with a question.
     * @method
     * @param {string} question - question to display to contact when they receive the SMP authentication request.
     * @param {string} secret - secret to use for authentication.
     * @throws {Error}
     */
    Session.prototype.smpStartQuestion = function (question, secret) {
        var session = this;
        if (!question) {
            throw (new Error("No Question Provided"));
        }
        var sec = secret;
        if (!sec) {
            sec = this.parameters ? this.parameters.secrets : undefined;
            if (!sec) {
                throw (new Error("No Secrets Provided"));
            }
            sec = sec[question];
        }
        if (!sec) {
            throw (new Error("No Secret Matched for Question"));
        }
        nextTick(function () {
            session.ops.initSMP(session.user.state, session.context, sec, question);
        });
    };

    /** Respond to an SMP authentication request.
     * @method
     * @param {string} [secret] - secret to use for authentication. If not provided it will be taken from session parameters.
     * @throws {Error}
     */
    Session.prototype.smpRespond = function (secret) {
        var session = this;
        var sec = secret || undefined;
        if (!sec) {
            sec = this.parameters || undefined;
        }
        if (!sec) {
            throw (new Error("No Secret Provided"));
        }
        nextTick(function () {
            session.ops.respondSMP(session.user.state, session.context, sec);
        });
    };

    /** Abort active SMP authentication
     * @method
     */
    Session.prototype.smpAbort = function () {
        var session = this;
        nextTick(function () {
            session.ops.abortSMP(session.user.state, session.context);
        });
    };

    /** Return true if session is encrypted (private)
     * @method
     * @returns {boolean}
     */
    Session.prototype.isEncrypted = function () {
        return (this.context.msgstate() === 1);
    };

    /** Return true if session is in Plaintext mode (not private)
     * @method
     * @returns {boolean}
     */
    Session.prototype.isPlaintext = function () {
        return (this.context.msgstate() === 0);
    };

    /** Return true if remote contact has disconnected
     * @method
     * @returns {boolean}
     */
    Session.prototype.isFinished = function () {
        return (this.context.msgstate() === 2);
    };

    /** Return true if contact's public key fingerpint is trusted. (authenticated with SMP)
     * @method
     * @returns {boolean}
     */
    Session.prototype.isAuthenticated = function () {
        return (this.context.trust() === "smp");
    };

    /** Returns the extra symmetric key and informs contact that we want to use it.
     * @method
     * @param {number} use
     * @param {ArrayBuffer} usedata
     * @returns {ArrayBuffer}
     */
    Session.prototype.extraSymKey = function (use, usedata) {
        return this.ops.extraSymKey(this.user.state, this.context, use, usedata);
    };

    /** Returns contact's instance tag
     * @method
     * @return {number}
     */
    Session.prototype.theirInstance = function () {
        return this.context.their_instance();
    };

    /** Returns our instance tag
     * @method
     * @return {number}
     */
    Session.prototype.ourInstance = function () {
        return this.context.our_instance();
    };

    /** Returns the active OTR protocol version
     * @method
     * @return {number}
     */
    Session.prototype.protocolVersion = function () {
        return this.context.protocol_version();
    };

    /** Returns the contact's human readable public key fingerprint
     * @method
     * @return {string}
     */
    Session.prototype.theirFingerprint = function () {
        return this.context.fingerprint();
    };

    /** Call the destroy method to remove all event listeners and release resources used by the session.
     * @method
     */
    Session.prototype.destroy = function () {
        var session = this;
        if (session.message_poll_interval) {
            clearInterval(session.message_poll_interval);
        }
        session.removeAllListeners();
        this.user = undefined;
        this.context = undefined;
        this.parameters = undefined;
        this.ops = undefined; //todo - free allocated memory for OtrlMessageAppOps structure.
    };

    /**
     * Optional OTR Session parameters.
     * @typedef {Object} OTRParams
     * @property {number} policy - {@link module:otr.POLICY POLICY} default is otr.POLICY.DEFAULT
     * @property {string} secret - shared secret to use during SMP authentication if not specified as argument in smp methods.
     * @property {number} MTU - max message fragment size in bytes, default is 0 which means no fragmentation.
     */

    //add a simple events API for use in the browser
    if (!Session.prototype.on) {
        Session.prototype.on = function (e, cb) {
            //used to register callbacks
            //store event name e in this._events
            if (this._events[e]) {
                this._events[e].push(cb);
            } else {
                this._events[e] = [cb];
            }
            return this;
        };
    }

    if (!Session.prototype.listeners) {
        Session.prototype.listeners = function (e) {
            if (this._events[e]) {
                return this._events[e];
            }
            return [];
        };
    }

    if (!Session.prototype.emit) {
        Session.prototype.emit = function (e) {
            //used internally to fire events
            //'apply' event handler function  to 'this' channel pass eventname 'e' and arguemnts.slice(1)
            var self = this;
            var args = Array.prototype.slice.call(arguments);
            var listeners_count = 0;
            if (this._events && this._events[e]) {
                listeners_count = this._events[e].length;
                this._events[e].forEach(function (cb) {
                    cb.apply(self, args.length > 1 ? args.slice(1) : [undefined]);
                });
                if (listeners_count > 0) return true;
            }
            return false;
        };
    }

    if (!Session.prototype.removeAllListeners) {
        Session.prototype.removeAllListeners = function (e) {
            if (e) {
                if (this._events[e]) {
                    this._events[e] = [];
                }
            } else {
                this._events = {};
            }
            return this;
        };
    }

}).call();