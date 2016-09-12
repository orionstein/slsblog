#[macro_use]
extern crate neon;
#[macro_use]
extern crate horrorshow;
extern crate markdown;

use neon::vm::{Call, JsResult, Module};
use neon::mem::Handle;
use neon::js::{JsString, JsArray, Key, JsObject, Object, Value, JsInteger};
use horrorshow::prelude::*;

fn unescape(text: &str) -> String {
	text.replace("&amp;", "&")
		.replace("&lt;", "<")
		.replace("&quot;","\"")
		.replace("&#8217;","'")
		.replace("&gt;",">")
}

fn build(call: Call) -> JsResult<JsString> {
    let scope = call.scope;
    let obj: Handle<JsObject> = JsObject::new(scope);
    let postData = try!(try!(call.arguments.require(scope, 0)).check::<JsString>());
    let qq : &str = &postData.value()[..];
    let postDataC = markdown::to_html(qq);
    let v = &postDataC[..];
    let un = unescape(v);
    let titlee = "Not Safe for Production";
    let postContent : String = markdown::to_html("__I am markdown__");
    let actual = html! {
        html {
            head {
                title { : titlee }
            }
            body {
                // attributes
                h1(id="heading") {
                    // Insert escaped text
                    : "Hello! This is <html />"
                }
                p {
                    // Insert raw text (unescaped)
                    : raw!(postContent)
                }
                div {
                    // Insert raw text (unescaped)
                    : raw!(un)
                }
                ol(id="count") {
                    // You can embed for loops, while loops, and if statements.
                    @ for i in 0..10 {
                        li(first? = (i == 0)) {
                            // Format some text.
                            : format_args!("{}", i+1)
                        }
                    }
                }
                // You need semi-colons for tags without children.
                br; br;
                p {
                    // You can also embed closures.
                    |tmpl| {
                        tmpl << "Easy!";
                    }
                }
            }
        }
    }.into_string().unwrap();
    let a_slice: &str = &actual[..];
    Ok(JsString::new(scope, a_slice).unwrap())
}

register_module!(m, {
    m.export("build", build)
});
