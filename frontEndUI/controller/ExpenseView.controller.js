
sap.ui.define([
  "frontEndUI/controller/BaseController",
  "sap/ui/core/mvc/Controller",
  "frontEndUI/model/formatter",
  'sap/ui/core/BusyIndicator',
  "sap/ui/model/Filter",
  "sap/ui/model/FilterOperator",
  'sap/m/MessageToast',
  'sap/m/MessageBox',
  "sap/m/Dialog",
  "sap/ui/core/Fragment",
  "frontEndUI/model/models",
  "sap/m/StandardTile",
  "sap/m/TileContainer",
  "sap/ui/export/Spreadsheet",

],
  /**
   * @param {typeof sap.ui.core.mvc.Controller} Controller
   */
  function (BaseController, Controller, formatter, BusyIndicator, Filter, FilterOperator, MessageToast, MessageBox, Dialog, Fragment, CMSModel, StandardTile, TileContainer,Spreadsheet) {
    "use strict";
    let oRouter, oGlobalModel;


    return BaseController.extend("frontEndUI.controller.ExpenseView", {
      formatter: formatter,
      onInit: function () {
        this.oResourceBundle = this.getOwnerComponent().getModel("i18n").getResourceBundle();
        oRouter = sap.ui.core.UIComponent.getRouterFor(this);

        BusyIndicator.show(0);
        const oRoute = oRouter.getRoute("ExpenseView");
        if (oRoute) {
          oRoute.attachMatched(this.onObjectMatched, this);
        }

      },
      onObjectMatched: function () {
        BusyIndicator.hide();
        oGlobalModel = sap.ui.getCore().getModel("oGlobalModel");
        if (oGlobalModel.getProperty("/LoginView/username") === "" || oGlobalModel.getProperty("/LoginView/username") === undefined) {
          oRouter.navTo("LoginView");
          return
        }

        var oDateRange = this.getView().byId("dateRange");
        var oToday = new Date();
        var oFirstDay = new Date(oToday.getFullYear(), oToday.getMonth(), 1);

        // Set date range value
        oDateRange.setDateValue(oFirstDay);     
        oDateRange.setSecondDateValue(oToday);   

        this.fnResetExpenseDetails();
        
              const oModel = new sap.ui.model.json.JSONModel();
              this.getView().setModel(oModel, "oMissedReminderModel");
              this.getView().setModel(oModel, "oUpcomingReminderModel");
              this.getView().setModel(oModel, "oExpenseModel");
        this.onLoadUpcomingReminder();
        this.onLoadMissedReminder();
        this.onFilter();
      },

      onAfterRendering: function () {
        BusyIndicator.hide();
      },
      onRefreshData: function () {
        this.onObjectMatched();
      },

      onNavBack: function () {
        oRouter.navTo("HomeView", true);
      },

      onLoadExpenseSummary: function () {
         const username = oGlobalModel.getProperty("/LoginView/username");
        const oDateRange = this.byId("dateRange");

        let oFromDate = oDateRange.getDateValue();
        let oToDate = oDateRange.getSecondDateValue();

        if (!oFromDate || !oToDate) { 
          return;
        }

        // Normalize full day in local time
        oFromDate.setHours(0, 0, 0, 0);
        oToDate.setHours(23, 59, 59, 999);
         

        // Send ISO strings (UTC)
        const payload = {
          username: username,
          fromDate: this._formatDateIST(oFromDate), // e.g. "2025-06-01T00:00:00.000Z"
          toDate: this._formatDateIST(oToDate)     // e.g. "2025-06-02T23:59:59.999Z"
        };

        const that = this;
        BusyIndicator.show(0);
        $.ajax({
          url: "/oData/v1/ExpenseServices/getExpenseDashboardSummary",
          method: "POST",
          contentType: "application/json",
          data: JSON.stringify(payload),
          success: function (response) {
            BusyIndicator.hide();
            if (response.status === "success") {
              const oModel = new sap.ui.model.json.JSONModel(response.data);
              that.getView().setModel(oModel, "oExpenseSummaryModel");
              console.log(response.data)
            } else {
              MessageToast.show("Failed to fetch dashboard data.");
            }
          },
          error: function (xhr, status, error) {
            BusyIndicator.hide();
            MessageToast.show("Error filtering expense data.");
            console.error("Filter API error:", error);
          }
        });
      },
      onLoadUpcomingReminder:function(){
          
        const that = this;
         const username = oGlobalModel.getProperty("/LoginView/username");
       
         const payload = {
          username: username,
          modulename:'ExpenseTracker'
        };
BusyIndicator.show(0);
        $.ajax({
          url: "/oData/v1/oReminderServices/getUpcomingReminders",
          method: "POST",
          contentType: "application/json",
          data: JSON.stringify(payload),
          success: function (response) {
            BusyIndicator.hide();
            if (response.status === "success") {
              const oModel = new sap.ui.model.json.JSONModel(response.data);
              that.getView().setModel(oModel, "oUpcomingReminderModel");
              console.log(response.data)
            } else {
              MessageToast.show("Failed to load upcoming Reminder data.");
            }
          },
          error: function (xhr, status, error) {
            BusyIndicator.hide();
            MessageToast.show("Error load upcoming Reminder data.");
            console.error("Filter API error:", error);
          }
        });
      },
      
      onLoadMissedReminder:function(){
          
        const that = this;
         const username = oGlobalModel.getProperty("/LoginView/username");
       
         const payload = {
          username: username,
          modulename:'ExpenseTracker'
        };
BusyIndicator.show(0);
        $.ajax({
          url: "/oData/v1/oReminderServices/getMissedReminders",
          method: "POST",
          contentType: "application/json",
          data: JSON.stringify(payload),
          success: function (response) {
            BusyIndicator.hide();
            if (response.status === "success") {
              const oModel = new sap.ui.model.json.JSONModel(response.data);
              that.getView().setModel(oModel, "oMissedReminderModel");
              console.log(response.data)
            } else {
              MessageToast.show("Failed to load missed Reminder data.");
            }
          },
          error: function (xhr, status, error) {
            BusyIndicator.hide();
            MessageToast.show("Error load missed Reminder data.");
            console.error("Filter API error:", error);
          }
        });
      },
      onReset:function(){
        var oDateRange = this.getView().byId("dateRange");
        var oToday = new Date();
        var oFirstDay = new Date(oToday.getFullYear(), oToday.getMonth(), 1);

        // Set date range value
        oDateRange.setDateValue(oFirstDay);     
        oDateRange.setSecondDateValue(oToday); 
        this.onFilter()
      },

_formatDateIST: function(dateObj) {
    return dateObj.toISOString()
    
},
      onFilter: function () {
        this.onLoadExpenseSummary();
        
        const username = oGlobalModel.getProperty("/LoginView/username");
        const oDateRange = this.byId("dateRange");

        let oFromDate = oDateRange.getDateValue();
        let oToDate = oDateRange.getSecondDateValue();
        console.log(oFromDate)
        if (!oFromDate || !oToDate) { 
          return;
        }

        // Normalize full day in local time
        oFromDate.setHours(0, 0, 0, 0);
        oToDate.setHours(23, 59, 59, 999);
         
        console.log(this._formatDateIST(oFromDate)+"-----"+this._formatDateIST(oToDate) )
        // Send ISO strings (UTC)
        const payload = {
          username: username,
          fromDate: this._formatDateIST(oFromDate), // e.g. "2025-06-01T00:00:00.000Z"
          toDate: this._formatDateIST(oToDate)     // e.g. "2025-06-02T23:59:59.999Z"
        };

        const that = this;
        BusyIndicator.show(0);
        $.ajax({
          url: "/oData/v1/ExpenseServices/getExpenseListsbyUser",
          method: "POST",
          contentType: "application/json",
          data: JSON.stringify(payload),
          success: function (response) {
            BusyIndicator.hide();
            if (response.status === "success") {
              var oModel = new sap.ui.model.json.JSONModel(response);
              that.getView().setModel(oModel, "oExpenseModel");
              MessageToast.show("Expense data loaded successfully.");
            } else {
              MessageToast.show("Failed to load Expense data.");
            }
          },
          error: function (xhr, status, error) {
            BusyIndicator.hide();
            MessageToast.show("Error filtering expense data.");
            console.error("Filter API error:", error);
          }
        });
      },
         

      onAddCategory: function () {
        oRouter.navTo("ExpenseCategoryConfig", true);
      },













      // 
      fnResetExpenseDetails: function () {
        const oViewModel = new sap.ui.model.json.JSONModel({
          formData: {
            datetime: new Date().toISOString(),
            type: "Expense",
            payment_mode: "Cash",
            is_planned: true,
            category: "",
            sub_category: "",
            amount: "",
            payment_status: "Paid",
            description: "",
            impact_saving: false,
            cycle: "daily",
            merchant_name: "",
            with_whom: "",
            notes: "",
            expense_mood: "Needed",
            username: oGlobalModel.getProperty("/LoginView/username")
          },
          mode: "Add",
          id: '',
          types: [
            { key: "Expense", text: "Expense" },
            { key: "Income", text: "Income" },
            { key: "Transfer", text: "Transfer" },
            { key: "Loan", text: "Loan" }
          ],
          paymentModes: [
            { key: "Credit Card", text: "Credit Card" },
            { key: "Debit Card", text: "Debit Card" },
            { key: "UPI", text: "UPI" },
            { key: "Cash", text: "Cash" },
            { key: "Wallet", text: "Wallet" },
            { key: "Bank Transfer", text: "Bank Transfer" }
          ],
          paymentStatuses: [
            { key: "Paid", text: "Paid" },
            { key: "Not Paid", text: "Not Paid" }
          ],
          cycles: [
            { key: "Daily", text: "Daily" },
            { key: "Weekly", text: "Weekly" },
            { key: "Monthly", text: "Monthly" }
          ],
          moods: [
            { key: "Needed", text: "🟢 Needed" },
            { key: "Urgent", text: "🔴 Urgent" },
            { key: "Want", text: "🟡 Want" },
            { key: "Fun", text: "🟣 Fun" }
          ]
        });
        this.getView().setModel(oViewModel, "viewModel");

        this._loadCategoryList();
      },


      onAddExpense: function () {
        this.fnResetExpenseDetails();
        this.openExpenseDialog("Add", null);
      },
      onEditPress: function (oEvent) {
        this.fnResetExpenseDetails();
        const oContext = oEvent.getSource().getBindingContext("oExpenseModel");
        const oData = oContext.getObject();
        const id = oData.id;
        const username = oGlobalModel.getProperty("/LoginView/username");
        const that = this
        const oModel = this.getView().getModel("viewModel");

        oModel.setProperty("/id", id);

BusyIndicator.show(0);
        // Call API to fetch full expense data
        $.ajax({
          url: "/oData/v1/ExpenseServices/readExpenseByID",
          method: "POST",
          contentType: "application/json",
          data: JSON.stringify({ username, id }),
          success: function (response) {
            BusyIndicator.hide();
            if (response.status === "success" && response.data) {
              const expenseData = response.data;

              // Map API response to formData structure
              const mappedData = {
                datetime: new Date(expenseData.transactiontime),
                type: expenseData.type.toLowerCase(), // assuming backend sends "Expense", convert to "expense"
                payment_mode: expenseData.payment_mode,
                is_planned: expenseData.is_planned,
                category: expenseData.category,
                sub_category: expenseData.subcategory,
                amount: expenseData.amount,
                payment_status: expenseData.payment_status,
                description: expenseData.description,
                impact_saving: expenseData.saving_impact,
                cycle: expenseData.cycle.toLowerCase(),
                merchant_name: expenseData.merchant_name,
                with_whom: expenseData.with_whom,
                notes: expenseData.notes,
                expense_mood: expenseData.expense_mood.includes("Urgent") ? "Urgent" : "Needed", // simplify if needed
                username: expenseData.username
              };

              // Open the dialog with the mapped data
              that.openExpenseDialog("Edit", mappedData);
            } else {
              MessageToast.show("Failed to fetch expense data.");
            }
          },
          error: function () {
            BusyIndicator.hide();
            MessageToast.show("Error while fetching expense data.");
          }
        });
      },



      onDelete: function (oEvent) {

        const that = this;

        const oContext = oEvent.getSource().getBindingContext("oExpenseModel");
        const oData = oContext.getObject();
        const id = oData.id;
        const username = oGlobalModel.getProperty("/LoginView/username");



        if (!username || !id) {
          MessageBox.error("Missing required information for deletion.");
          return;
        }

        MessageBox.confirm(
          `Are you sure you want to delete category "${oData.category} - ${oData.subcategory}" & Amount = ${oData.amount}?`,
          {
            title: "Confirm Deletion",
            onClose: function (oAction) {
              if (oAction === MessageBox.Action.OK) {
                BusyIndicator.show(0);
                // Proceed with AJAX delete call
                $.ajax({
                  url: "/oData/v1/ExpenseServices/deleteExpense", // your actual endpoint
                  method: "DELETE",
                  contentType: "application/json",
                  data: JSON.stringify({
                    username: username,
                    id: id
                  }),
                  success: function (response) {
                    BusyIndicator.hide();
                    MessageToast.show("Deleted successfully.");
                    that.onFilter?.(); // assuming you have a reload method
                  },
                  error: function (xhr) {
                    BusyIndicator.hide();
                    const message = "Unknown error occurred.";
                    if (xhr.status === 409) {
                      MessageBox.warning(message);
                    } else if (xhr.status === 404) {
                      MessageBox.error("Expense  not found.");
                    } else {
                      MessageBox.error("Error: " + message);
                    }
                  }
                });
              }
            }
          }
        );
      },




      openExpenseDialog: function (mode, data) {

        const oView = this.getView();
        const oModel = oView.getModel("viewModel");

        oModel.setProperty("/mode", mode);
        oModel.setProperty("/formData", data || {
          datetime: new Date().toISOString(),
          type: "expense",
          payment_mode: "Cash",
          is_planned: false,
          category: "",
          sub_category: "",
          amount: "",
          payment_status: "Paid",
          description: "",
          impact_saving: false,
          cycle: "daily",
          merchant_name: "",
          with_whom: "",
          notes: "",
          expense_mood: "Needed",
          username: oGlobalModel.getProperty("/LoginView/username")
        });



        if (!this.byId("expenseDialog")) {
          if (!this._oAddDialog) {
            this._oAddDialog = sap.ui.xmlfragment("frontEndUI.view.fragment.AddExpense", this);
            oView.addDependent(this._oAddDialog);
          }

          // Set dynamic width based on device
          var isPhone = sap.ui.Device.system.phone;
          this._oAddDialog.setContentWidth(isPhone ? "100%" : "70%");
          this._oAddDialog.open();
        } else {
          this.byId("expenseDialog").open();
        }
      },

      onSwitchChange: function (oEvent) {
        const key = oEvent.getSource().data("key");
        const value = oEvent.getParameter("state") ? "Yes" : "No";
        this.getView().getModel("viewModel").setProperty(`/formData/${key}`, value);
      },

      onSaveExpense: function () {
        const oDate = this.getView().getModel("viewModel").getProperty("/formData").datetime; 
        const istDate = new Date(oDate); 
        const utcDateTime = istDate.toISOString(); 
        this.getView().getModel("viewModel").setProperty("/formData/datetime", istDate);

        const oData = this.getView().getModel("viewModel").getProperty("/formData");
        oData.username = oGlobalModel.getProperty("/LoginView/username");

        if (!oData.datetime || !oData.type || !oData.amount || !oData.category || !oData.username) {
          MessageBox.error("Please fill in all required fields.");
          return;
        }


        const oModel = this.getView().getModel("viewModel");
        var userMode = oModel.getProperty("/mode");

        var sUrl = "/oData/v1/ExpenseServices/updateExpense/" + oModel.getProperty("/id");
        if (userMode === "Add") {
          sUrl = "/oData/v1/ExpenseServices/insertExpense";
        }
BusyIndicator.show(0);
        $.ajax({
          url: sUrl, // Update with your actual backend route
          method: "POST",
          contentType: "application/json",
          data: JSON.stringify(oData),
          success: () => {
            BusyIndicator.hide();
            MessageToast.show("Expense saved successfully.");
            this.onDialogClose();
            this.onFilter?.(); // Optional: reload list if available
          },
          error: (err) => {
            BusyIndicator.hide();
            MessageBox.error("Failed to save expense.");
          }
        });
      },

      onDialogClose: function () {
        if (this._oAddDialog) {
          this._oAddDialog.close();
        }
      },

      _loadCategoryList: function () {

        let username = oGlobalModel.getProperty("/LoginView/username");
        BusyIndicator.show(0);
        $.ajax({
          url: "/oData/v1/ExpenseCategoryConfigServices/getCategoryListsByUser",
          method: "POST",
          contentType: "application/json",
          data: JSON.stringify({ username }),
          success: (data) => {
            BusyIndicator.hide();
            const oCategoryModel = new sap.ui.model.json.JSONModel(data || []);
            this.getView().setModel(oCategoryModel, "categoryModel");
          },
          error: () => {
            BusyIndicator.hide();
            MessageBox.error("Failed to load categories.");
          }
        });
      },

      onCategoryChange: function (oEvent) {

        let username = oGlobalModel.getProperty("/LoginView/username");
        const category = oEvent.getParameter("selectedItem").getKey();
BusyIndicator.show(0);
        $.ajax({
          url: `/oData/v1/ExpenseCategoryConfigServices/getSubCategoryListsByUser`,
          method: "POST",
          contentType: "application/json",
          data: JSON.stringify({ username, category }),
          success: (data) => {
            BusyIndicator.hide();
            const oSubcategoryModel = new sap.ui.model.json.JSONModel(data || []);
            this.getView().setModel(oSubcategoryModel, "subcategoryModel");
          },
          error: () => {
            BusyIndicator.hide();
            MessageBox.error("Failed to load subcategories.");
          }
        });
      },

    onExportExpense: async function () { 
  const oView = this.getView();
  const aData = oView.getModel("oExpenseModel").getProperty("/data");

  if (!aData || aData.length === 0) {
    sap.m.MessageToast.show("No expense data to export.");
    return;
  }

  // Ask user for file name
  const oDialog = new sap.m.Dialog({
    title: "Enter File Name",
    content: new sap.m.Input("fileNameInput", {
      placeholder: "e.g., MyExpenses"
    }),
    beginButton: new sap.m.Button({
      text: "Export",
      press: () => {
        const sFileName = sap.ui.getCore().byId("fileNameInput").getValue().trim();
        if (!sFileName) {
          sap.m.MessageToast.show("Please enter a valid file name.");
          return;
        }

        oDialog.close();
        oDialog.destroy(); 
        this._exportUsingSheetJS(aData, sFileName);
      }
    }),
    endButton: new sap.m.Button({
      text: "Cancel",
      press: () => {
      oDialog.close();
      oDialog.destroy(); // also destroy on cancel
    }
    })
  });

  oDialog.open();
},
_exportUsingSheetJS: function (aData, sFileName) {
  const monthSheets = {};
  const summaryData = [];

  aData.forEach(item => {
    const dateObj = new Date(item.transactiontime);
    const month = dateObj.toLocaleString("default", { month: "short" });
    const year = dateObj.getFullYear();
    const sheetName = `${month}_${year}`;

    if (!monthSheets[sheetName]) {
      monthSheets[sheetName] = [];
    }

    monthSheets[sheetName].push({
      Category: item.category,
      Subcategory: item.subcategory,
      Description: item.description,
      "Payment Mode": item.payment_mode,
      Amount: parseFloat(item.amount),
      "Date/Time": dateObj.toLocaleString("en-IN", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false
      })
    });
  });

  const wb = XLSX.utils.book_new();

  // Process each sheet
  Object.entries(monthSheets).forEach(([sheet, data]) => {
    const wsData = [...data];

    // Totals
    let totalAmount = 0;
    const paymentModeTotals = {};

    data.forEach(entry => {
      totalAmount += entry.Amount;
      const mode = entry["Payment Mode"] || "Other";
      paymentModeTotals[mode] = (paymentModeTotals[mode] || 0) + entry.Amount;
    });

    // Push total row
    wsData.push({});
    wsData.push({ Description: "Total Amount", Amount: totalAmount });

    Object.keys(paymentModeTotals).forEach(mode => {
      wsData.push({
        Description: `${mode} Total`,
        Amount: paymentModeTotals[mode]
      });
    });

    // Add to summary
    summaryData.push({
      Month: sheet,
      Total: totalAmount,
      ...paymentModeTotals
    });

    const ws = XLSX.utils.json_to_sheet(wsData, { origin: "A1" });

    // Set column widths
    ws["!cols"] = [
      { wch: 30 }, // Category
      { wch: 30 }, // Subcategory
      { wch: 70 }, // Description
      { wch: 20 }, // Payment Mode
      { wch: 15 }, // Amount
      { wch: 25 } // Date/Time
    ];

    // Freeze header
    ws["!freeze"] = { xSplit: 0, ySplit: 1 };

    // Style header row (bold + yellow)
    const headerRange = XLSX.utils.decode_range(ws["!ref"]);
    const headerRow = headerRange.s.r;

    for (let c = headerRange.s.c; c <= headerRange.e.c; c++) {
      const cellAddr = XLSX.utils.encode_cell({ r: headerRow, c });
      if (ws[cellAddr]) {
        ws[cellAddr].s = {
          font: { bold: true },
          fill: { fgColor: { rgb: "FFFF00" } },
          alignment: { horizontal: "center" }
        };
      }
    }

    XLSX.utils.book_append_sheet(wb, ws, sheet);
  });

  // Summary sheet
  const summarySheet = XLSX.utils.json_to_sheet(summaryData);
  summarySheet["!cols"] = [{ wch: 20 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }];

  // Format headers in summary
  const summaryHeaders = XLSX.utils.decode_range(summarySheet["!ref"]);
  for (let c = summaryHeaders.s.c; c <= summaryHeaders.e.c; c++) {
    const cellAddr = XLSX.utils.encode_cell({ r: summaryHeaders.s.r, c });
    if (summarySheet[cellAddr]) {
      summarySheet[cellAddr].s = {
        font: { bold: true },
        fill: { fgColor: { rgb: "FFFF00" } },
        alignment: { horizontal: "center" }
      };
    }
  }

  XLSX.utils.book_append_sheet(wb, summarySheet, "Summary");

  XLSX.writeFile(wb, `${sFileName}.xlsx`);
  sap.m.MessageToast.show("Expense Details Exported in Excel format Successfully🎉");
},
 
 

onListItemPress: function (oEvent) {
    const oContext = oEvent.getSource().getBindingContext();
    console.log("Pressed:", oContext.getObject());
    // Navigate or show popup detail
},

onReminderCompletePress: function (oEvent) {
    var that = this;

    // Get the context and ID of the selected reminder
    var oBindingContext = oEvent.getSource().getBindingContext("oUpcomingReminderModel");
    var oReminderData = oBindingContext.getObject();
    var reminderId = oReminderData.id;

    // Confirm with user
    MessageBox.confirm("Are you sure you want to complete this reminder?", {
        title: "Confirm Completion",
        actions: [MessageBox.Action.OK, MessageBox.Action.CANCEL],
        onClose: function (oAction) {
            if (oAction === MessageBox.Action.OK) {
                // Call backend
                $.ajax({
                    url: "/oData/v1/oReminderServices/markAsCompleted",
                    method: "POST",
                    contentType: "application/json",
                    data: JSON.stringify({ id: reminderId }),
                    success: function () {
                        // Optional: Refresh model
                        that.getView().getModel("oUpcomingReminderModel").refresh(true);
                        that.onLoadUpcomingReminder();
                        that.onLoadMissedReminder();

                        MessageToast.show("Reminder marked as completed.");
                    },
                    error: function () {
                        MessageBox.error("Failed to complete reminder. Please try again.");
                    }
                });
            }
        }
    });
},

onUpcomingReminderSnoozePress: function (oEvent) {
     const oBindingContext = oEvent.getSource().getBindingContext("oUpcomingReminderModel");
    const oReminderData = oBindingContext.getObject();
    this.onReminderSnooze(oReminderData)
},
onMissedReminderSnoozePress: function (oEvent) {
    const oBindingContext = oEvent.getSource().getBindingContext("oMissedReminderModel");
    const oReminderData = oBindingContext.getObject();
     this.onReminderSnooze(oReminderData)
},
onReminderSnooze: function (oReminderData) {
    const that = this; 
    // Create a DateTimePicker Dialog for user input
    const oDialog = new sap.m.Dialog({
        title: "Snooze Reminder",
        content: [
            new sap.m.Text({ text: "Are you sure you want to snooze this reminder to another time?" }),
            new sap.m.DateTimePicker("newRemindAt", {
                valueFormat: "yyyy-MM-ddTHH:mm:ss",
                displayFormat: "long",
                width: "100%",
                required: true
            })
        ],
        beginButton: new sap.m.Button({
            text: "OK",
            press: function () {
                const oDateTimePicker = sap.ui.getCore().byId("newRemindAt");
                const sNewDate = oDateTimePicker.getDateValue();

                if (!sNewDate) {
                    sap.m.MessageToast.show("Please select a valid date/time.");
                    return;
                }

                oDialog.close();

                // Call backend with new date and reminder ID
                that._snoozeReminder(oReminderData.id, sNewDate); 
            }
        }),
        endButton: new sap.m.Button({
            text: "Cancel",
            press: function () {
                oDialog.close();
            }
        }),
        afterClose: function () {
            oDialog.destroy();
        }
    });

    oDialog.open();
},

_snoozeReminder: function (reminderId, newRemindAt) {
    const oModel = new sap.ui.model.json.JSONModel();
    const sUrl = "/oData/v1/oReminderServices/snoozeReminder";
  var that = this;
    const oPayload = {
        id: reminderId,
        newRemindAt: newRemindAt
    };

    $.ajax({
        url: sUrl,
        method: "POST",
        contentType: "application/json",
        data: JSON.stringify(oPayload),
        success: function () {
            sap.m.MessageToast.show("Reminder snoozed successfully.");
              that.onLoadUpcomingReminder();
                        that.onLoadMissedReminder();
        },
        error: function (xhr) {
            sap.m.MessageBox.error("Failed to snooze reminder: " + xhr.responseText);
        }
    });
},




















    });
  });