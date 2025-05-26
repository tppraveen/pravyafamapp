sap.ui.define([
  "sap/ui/core/UIComponent"
], function (UIComponent) {
  "use strict";

  return UIComponent.extend("sap.ui.demo.hello.Component", {
    metadata: {
      manifest: "json"
    },

    init: function () {
      UIComponent.prototype.init.apply(this, arguments);
    }
  });
});
