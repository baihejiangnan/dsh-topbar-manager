window.__ModuleLoader__.load({
  id: "dsh-topbar-manager",
  factory: function (require) {
    var module = { exports: {} };
    var exports = module.exports;
    var React = require("react");

    var STORAGE_KEY = "dsh-topbar-manager";
    var DEFAULT_STATE = {
      "checkpoint-diff": false,
      "session-manage": false,
      "delete-current": false,
      "undo-buttons": true
    };

    var BUTTONS = [
      { key: "checkpoint-diff", label: "Diff", selector: '[data-checkpoint-diff-trigger]' },
      { key: "session-manage", label: "对话管理", selector: '[data-dsh-header-button]' },
      { key: "delete-current", label: "删除本对话", selector: '[data-dsh-delete-current]' },
      { key: "undo-buttons", label: "撤销/恢复/快照", selector: '[data-undo-header]' }
    ];

    function loadState() {
      try {
        var raw = localStorage.getItem(STORAGE_KEY);
        if (raw) return Object.assign({}, DEFAULT_STATE, JSON.parse(raw));
      } catch (e) {}
      return Object.assign({}, DEFAULT_STATE);
    }

    function saveState(state) {
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (e) {}
    }

    function applyStyle(state) {
      var css = BUTTONS.filter(function (btn) {
        return state[btn.key] === false;
      }).map(function (btn) {
        return btn.selector + " { display: none !important; }";
      }).join("\n");
      var tag = document.getElementById("dsh-topbar-manager-style");
      if (!tag) {
        tag = document.createElement("style");
        tag.id = "dsh-topbar-manager-style";
        document.head.appendChild(tag);
      }
      tag.textContent = css;
    }

    function apply(ctx) {
      var state = loadState();
      applyStyle(state);

      ctx.effect(function () {
        return function () {
          var tag = document.getElementById("dsh-topbar-manager-style");
          if (tag) tag.remove();
        };
      });

      ctx.slots.inject("settings.section", function () {
        return ctx.slots.register({
          name: "settings.section",
          id: "dsh-topbar-manager",
          order: 200,
          label: function () { return "顶部按钮管理"; }
        }, function TopbarManagerSettings() {
          var current = loadState();
          var setState = React.useState(0)[1];
          return React.createElement("div", { className: "dsh-topbar-manager-settings" },
            React.createElement("p", null, "控制插件添加到顶部工具栏的按钮显示状态。"),
            BUTTONS.map(function (btn) {
              return React.createElement("label", { key: btn.key, style: { display: "block", margin: "6px 0" } },
                React.createElement("input", {
                  type: "checkbox",
                  checked: current[btn.key] !== false,
                  onChange: function (e) {
                    var next = loadState();
                    next[btn.key] = e.target.checked;
                    saveState(next);
                    applyStyle(next);
                    setState(function (n) { return n + 1; });
                  }
                }),
                " " + btn.label
              );
            })
          );
        });
      });
    }

    exports.apply = apply;
    exports.inject = ["slots"];
    return module.exports;
  }
});
