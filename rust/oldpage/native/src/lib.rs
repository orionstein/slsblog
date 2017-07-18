#[macro_use]
extern crate neon;
extern crate handlebars;
extern crate rustc_serialize;
extern crate glob;
extern crate markdown;
use neon::vm::{Call, JsResult, Module};
use neon::mem::{Handle, Managed};
use neon::js::{JsString, JsArray, JsValue, JsObject, Object, Value};
use std::path::Path;
use handlebars::Handlebars;
use std::collections::BTreeMap;
use rustc_serialize::json::{Json, ToJson};
use glob::glob;

fn unescape(text: &str) -> String {
	text.replace("&amp;", "&")
		.replace("&lt;", "<")
		.replace("&quot;","\"")
		.replace("&#8217;","'")
		.replace("&gt;",">")
}

fn build(call: Call) -> JsResult<JsString> {
    let scope = call.scope;
    let mut handlebars = Handlebars::new();

    for entry in glob("./templates/**/*.hbs").expect("Failed to read glob pattern") { 
	    match entry {
		    Ok(path) => {
			    let template_name = path.file_stem().unwrap().to_string_lossy().into_owned();
			    let template_slice : &str = &template_name[..]; 
			    handlebars.register_template_file(template_slice, path).ok().unwrap();
		    },
			    Err(e) => println!("{:?}", e),
	    }
    }

    let mut blogData: BTreeMap<String, Json> = BTreeMap::new();
    let blog: Handle<JsObject> = try!(try!(call.arguments.require(scope, 0)).check::<JsObject>());
    let blogItems = try!(blog.get_own_property_names(scope));
    let blogItemIter = (blogItems).to_vec(scope);
    for prop in &blogItemIter {
      for entry in &*prop {
        let nameString = try!(JsValue::to_string((**entry), scope));
        let nameExtract = (*nameString).value();
        let item = try!(blog.get(scope, nameString));
        let bItem = try!(JsValue::to_string((*item), scope));
        let bItemExtract = (*bItem).value();
        blogData.insert(nameExtract.to_string(), bItemExtract.to_json());
      }
    }

    let postData = try!(try!(call.arguments.require(scope, 1)).check::<JsString>());
    let qq : &str = &postData.value()[..];
    let postDataC = markdown::to_html(qq);
    let v = &postDataC[..];
    let un = unescape(v);

    let mut postData: BTreeMap<String, Json> = BTreeMap::new();
    postData.insert("title".to_string(), "base0".to_json());
    postData.insert("content".to_string(), un.to_json());

    let mut data: BTreeMap<String, Json> = BTreeMap::new();
    data.insert("blog".to_string(), blogData.to_json());
    data.insert("post".to_string(), postData.to_json());
    let dataJson = data.to_json();

    let pageString = handlebars.render("page", &dataJson).ok().unwrap();
    let pageSlice : &str = &pageString[..];
    Ok(JsString::new(scope, pageSlice).unwrap())
}

register_module!(m, {
    m.export("build", build)
});
