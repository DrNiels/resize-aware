This is a conversion of the resize-aware element from mlisook (https://www.webcomponents.org/element/mlisook/resize-aware/elements/resize-aware) with some minor adjustments. The readme was not updated and is still the one from the original resize-aware element!

# resize-aware

Container element that is aware of, and notifies of, changes to its size.

## Why

Sometimes you may need to take some action when the rendered size of an element changes. This element provides the 
something like the window resize event but for an individual element.

There are many reasons an element's size could change - CSS or class changes, content changes, content of other elements affecting
the flow, viewport changes, etc.  This element detects the size changes without polling or loops.

This custom control uses code from [procurios/ResizeSensor](https://github.com/procurios/ResizeSensor) modified to work with Polymer in both Shadow and Shady DOM.

## Install
For Polymer 2.0 projects, install the 2.0 native, class based version:

`bower install --save resize-aware`

For Polymer 1.x projects, install the hybrid version:

`bower install --save resize-aware#^1.9.1`

## How to Use
```html
<link rel="import" href="../../bower_components/resize-aware.html" />
```

```html
<resize-aware on-element-size-changed="handleChange">
    <p>
      [[theReview]]
    </p>
    <img src="[[thePic]]">
</resize-aware>
 ```
 or
 ```html
<resize-aware>
  any content that could have been in a div
</resize-aware>
```
```javascript
this.$$('resize-aware').addEventListener('element-resize', this.someHandlerName);
```

 ## Change Notification

 You can either include a handler in the markup:
```html
<resize-aware on-element-size-changed="someHandlerName">
  stuff to watch
</resize-aware>
 ```
 or listen for the event:
 ```javascript
 this.$$('resize-aware').addEventListener('element-resize', this.someHandlerName);
 ```

## License

MIT license
