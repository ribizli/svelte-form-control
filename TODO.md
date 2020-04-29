### Planned features

* avoid hardcoded validator messages (return object from validation, like Angular)
  * placeholders can be supported: `{ min: [4 /* required */, 2 /* current */] }`
  * create an error component instead of `controlError`
    * global error messages are configurable
* async validation support
