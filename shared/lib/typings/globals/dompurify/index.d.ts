// Generated by typings
// Source: https://raw.githubusercontent.com/DefinitelyTyped/DefinitelyTyped/56295f5058cac7ae458540423c50ac2dcf9fc711/dompurify/dompurify.d.ts
interface IDOMPurify {
  sanitize(s:string):string;
  sanitize(s:string, config:IDOMPurifyConfig):any;

  addHook(hook:string, cb:(currentNode:Element, data:any, config:IDOMPurifyConfig) => Element):void;
}

interface IDOMPurifyConfig {
  ADD_ATTR?:string[];
  ADD_TAGS?:string[];
  ALLOW_DATA_ATTR?:boolean;
  ALLOWED_ATTR?:string[];
  ALLOWED_TAGS?:string[];
  FORBID_ATTR?:string[];
  FORBID_TAGS?:string[];
  KEEP_CONTENT?:boolean;
  RETURN_DOM?:boolean;
  RETURN_DOM_FRAGMENT?:boolean;
  RETURN_DOM_IMPORT?:boolean;
  SAFE_FOR_JQUERY?:boolean;
  SANITIZE_DOM?:boolean;
  WHOLE_DOCUMENT?:boolean;
}

declare var DOMPurify:IDOMPurify;

declare module 'dompurify' {
  export = DOMPurify;
}