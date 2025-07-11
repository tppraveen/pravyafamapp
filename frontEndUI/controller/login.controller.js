sap.ui.define([
  "frontEndUI/controller/BaseController",
	"sap/ui/core/mvc/Controller",
	"frontEndUI/model/formatter",
	'sap/ui/core/BusyIndicator',
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	'sap/m/MessageToast', 
	"frontEndUI/model/models"
],
/**
 * @param {typeof sap.ui.core.mvc.Controller} Controller
 */
function(BaseController,Controller, formatter, BusyIndicator, Filter, FilterOperator, MessageToast,CMSModel) {
	"use strict";
	var oRouter;
	return BaseController.extend("frontEndUI.controller.login", {
		formatter: formatter,
		onInit: function() {
			oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			oRouter.getRoute("LoginView").attachMatched(this.onObjectMatched, this);
			this.oResourceBundle = this.getOwnerComponent().getModel("i18n").getResourceBundle();

			// Get Zone list
			//this.getZoneLists();
		},

		onAfterRendering: function() {
		 
		},
		onObjectMatched: function() {
			//Reset Inputs
			// var oprocessComboBox = this.getView().byId("idCMSHome_ProcessSelectInput");
			// if (oprocessComboBox) {
			// 	oprocessComboBox.setSelectedKey("");
			// 	oprocessComboBox.setValue("");
			// }
		},
		
    onLoginPress: function () {
BusyIndicator.show(0);
      const oView = this.getView();
      const sUsername = oView.byId("username").getValue();
      const sPassword = oView.byId("password").getValue();

      if (!sUsername || !sPassword) {
        MessageToast.show("Please enter username and password.");
        return;
      }
  		// 🔹 Set values in globalModel
      let oGlobalModel = sap.ui.getCore().getModel("oGlobalModel");
      oGlobalModel.setProperty("/LoginView/username", sUsername);
      oGlobalModel.setProperty("/LoginView/password", sPassword);
var that=this
      $.ajax({
        url: "/oData/v1/UserServices/validateLoginUser",
        method: "POST",
        contentType: "application/json",
        data: JSON.stringify({
          username: sUsername,
          password: sPassword
        }),
        success: function (response) {
          BusyIndicator.hide()
          that.onShowMessageTost(response.message || "Login successful!");

          // Navigate to Home
          const oRouter = sap.ui.core.UIComponent.getRouterFor(this);
          oRouter.navTo("HomeView");
        }.bind(this),
        error: function (xhr) {
          BusyIndicator.hide()
          let message = "Login failed. Please try again.";
          if (xhr.responseJSON && xhr.responseJSON.message) {
            message = xhr.responseJSON.message;
          }
          MessageToast.show(message);
        }
      });
    }
 

	});
});