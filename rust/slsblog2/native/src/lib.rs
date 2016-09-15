#[macro_use]
extern crate neon;
extern crate handlebars;
extern crate rustc_serialize;
extern crate glob;
use neon::vm::{Call, JsResult, Module};
use neon::js::{JsString, JsObject, JsArray, JsValue, Object, Value};
use neon::mem::{Handle, Managed};
use std::path::Path;
use handlebars::Handlebars;
use std::collections::BTreeMap;
use rustc_serialize::json::{Json, ToJson};
use glob::glob;

fn build(call: Call) -> JsResult<JsString> {
    let scope = call.scope;
    let mut handlebars = Handlebars::new();
    for entry in glob("./templates/**/*.hbs").expect("Failed to read glob pattern") { 
	    match entry {
		    Ok(path) => {
			    println!("{:?}", path.file_stem().unwrap());
			    let template_name = path.file_stem().unwrap().to_string_lossy().into_owned();
			    let template_slice : &str = &template_name[..]; 
			    handlebars.register_template_file(template_slice, path).ok().unwrap();
		    },
			    Err(e) => println!("{:?}", e)
	    }
    }
    

    let mut blogData: BTreeMap<String, Json> = BTreeMap::new();
    let blog: Handle<JsObject> = try!(try!(call.arguments.require(scope, 0)).check::<JsObject>());
    let blogItems = try!(blog.get_own_property_names(scope));
    println!("bi {}", blogItems.len());
    let blogItemIter = (blogItems).to_vec(scope);
    for prop in &blogItemIter {
      for entry in &*prop {
        let nameString = try!(JsValue::to_string((**entry), scope));
        let nameExtract = (*nameString).value();
        let item = try!(blog.get(scope, nameString));
        let bItem = try!(JsValue::to_string((*item), scope));
        let bItemExtract = (*bItem).value();
        println!("{:?}", nameExtract);
        println!("{:?}", bItemExtract);
        blogData.insert(nameExtract.to_string(), bItemExtract.to_json());
      }
    }

    let mut postArrData = vec![];
    let posts: Handle<JsArray> = try!(try!(call.arguments.require(scope, 1)).check::<JsArray>());
    println!("pi {}", posts.len());
    let postIter = try!((posts).to_vec(scope));
    for post in &postIter {
      let mut postData: BTreeMap<String, Json> = BTreeMap::new();
      let postObj: Handle<JsObject> = try!(post.check::<JsObject>());
      
      //ID
      let id = try!((postObj).get(scope, "id"));
      let ids = try!(JsValue::to_string((*id), scope));
      let ide = (*ids).value();

      //TITLE
      let title = try!((postObj).get(scope, "title"));
      let titles = try!(JsValue::to_string((*title), scope));
      let titlee = (*titles).value();
   
      //URL
      let url = try!((postObj).get(scope, "url"));
      let urls = try!(JsValue::to_string((*url), scope));
      let urle = (*urls).value();

      //SNIPPET
      let snippet = try!((postObj).get(scope, "snippet"));
      let snippets = try!(JsValue::to_string((*snippet), scope));
      let snippete = (*snippets).value();

      //DATE
      let date = try!((postObj).get(scope, "date"));
      let dates = try!(JsValue::to_string((*date), scope));
      let datee = (*dates).value();

      println!("{:?}", ide);
      println!("{:?}", titlee);
      println!("{:?}", urle);
      println!("{:?}", snippete);
      println!("{:?}", datee);

      postData.insert("id".to_string(), ide.to_json());
      postData.insert("title".to_string(), titlee.to_json());
      postData.insert("url".to_string(), urle.to_json());
      postData.insert("snippet".to_string(), snippete.to_json());
      postData.insert("date".to_string(), datee.to_json());

      postArrData.push(postData.to_json());
    }

    let mut data: BTreeMap<String, Json> = BTreeMap::new();
    data.insert("blog".to_string(), blogData.to_json());
    data.insert("posts".to_string(), postArrData.to_json());
    let dataJson = data.to_json();

    let pageString = handlebars.render("index", &dataJson).ok().unwrap();
    let pageSlice : &str = &pageString[..];
    Ok(JsString::new(scope, pageSlice).unwrap())
}

register_module!(m, {
    m.export("build", build)
});
