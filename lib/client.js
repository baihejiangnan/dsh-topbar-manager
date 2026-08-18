window.__ModuleLoader__.load({
  id: "dsh-topbar-manager",
  factory: function (require) {
    var module = { exports: {} };
    var exports = module.exports;
    var React = require("react");

    var STORAGE_KEY = "dsh-topbar-manager";

    var KNOWN_BUTTONS = [
      { key: "checkpoint-diff", label: "Diff", plugin: "dsh-checkpoint-diff", selector: '[data-checkpoint-diff-trigger]', defaultVisible: false },
      { key: "session-manage", label: "对话管理", plugin: "dsh-session-manager", selector: '[data-dsh-header-button]', defaultVisible: false },
      { key: "delete-current", label: "删除本对话", plugin: "dsh-session-manager", selector: '[data-dsh-delete-current]', defaultVisible: false },
      { key: "undo-buttons", label: "撤销/恢复/快照", plugin: "dsh-undo-savepoint", selector: '[data-undo-header]', defaultVisible: true }
    ];

    var SLOT_SELECTOR = '[data-slot="conversation.session.header.actions"], [data-slot="conversation.session.header.utilities"]';

    var SETTINGS_CSS = [
      ".dshtm-settings { max-width: 720px; margin: 0 auto; padding: 8px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif; color: #1f2329; }",
      ".dshtm-card { background: #fff; border: 1px solid #e5e8ef; border-radius: 12px; box-shadow: 0 1px 2px rgba(0,0,0,0.04); padding: 20px; }",
      ".dshtm-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; margin-bottom: 16px; }",
      ".dshtm-header h3 { margin: 0 0 4px; font-size: 16px; font-weight: 600; color: #111827; }",
      ".dshtm-header p { margin: 0; font-size: 13px; color: #6b7280; line-height: 1.5; }",
      ".dshtm-check-btn { flex: none; padding: 7px 16px; border: 1px solid #2563eb; background: #2563eb; color: #fff; border-radius: 8px; font-size: 13px; font-weight: 500; cursor: pointer; transition: background .15s ease, border-color .15s ease; }",
      ".dshtm-check-btn:hover { background: #1d4ed8; border-color: #1d4ed8; }",
      ".dshtm-message { margin-bottom: 12px; padding: 8px 12px; border-radius: 8px; background: #eff6ff; color: #1e40af; font-size: 13px; }",
      ".dshtm-list { display: flex; flex-direction: column; gap: 8px; }",
      ".dshtm-row { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 12px 14px; border: 1px solid #edf0f5; border-radius: 10px; background: #fafbfc; }",
      ".dshtm-info { display: flex; flex-direction: column; gap: 2px; min-width: 0; }",
      ".dshtm-label { font-size: 14px; font-weight: 500; color: #1f2329; }",
      ".dshtm-plugin { font-size: 12px; color: #6b7280; }",
      ".dshtm-switch { position: relative; display: inline-block; width: 42px; height: 24px; flex: none; }",
      ".dshtm-switch input { opacity: 0; width: 0; height: 0; }",
      ".dshtm-slider { position: absolute; cursor: pointer; inset: 0; background: #d1d5db; border-radius: 999px; transition: background .2s ease; }",
      ".dshtm-slider::before { content: ''; position: absolute; height: 18px; width: 18px; left: 3px; bottom: 3px; background: #fff; border-radius: 50%; transition: transform .2s ease; box-shadow: 0 1px 2px rgba(0,0,0,0.2); }",
      ".dshtm-switch input:checked + .dshtm-slider { background: #2563eb; }",
      ".dshtm-switch input:checked + .dshtm-slider::before { transform: translateX(18px); }"
    ].join("\n");

    function injectSettingsStyle() {
      var tag = document.getElementById("dsh-topbar-manager-settings-style");
      if (!tag) {
        tag = document.createElement("style");
        tag.id = "dsh-topbar-manager-settings-style";
        document.head.appendChild(tag);
      }
      tag.textContent = SETTINGS_CSS;
    }

    function knownForButton(btn) {
      for (var i = 0; i < KNOWN_BUTTONS.length; i++) {
        var item = KNOWN_BUTTONS[i];
        if (item.selector && btn.matches && btn.matches(item.selector)) return item;
      }
      return null;
    }

    function labelForButton(btn) {
      return (btn.textContent || btn.title || btn.getAttribute("aria-label") || "").trim();
    }

    function keyForButton(btn) {
      var known = knownForButton(btn);
      if (known) return known.key;
      var slot = "";
      var parent = btn.closest ? btn.closest("[data-slot]") : null;
      if (parent) slot = parent.getAttribute("data-slot") || "";
      return "unknown|" + slot + "|" + labelForButton(btn);
    }

    function pluginForButton(btn) {
      var known = knownForButton(btn);
      if (known) return known.plugin;
      return "未知插件（未测试）";
    }

    function defaultState() {
      var visibility = {};
      var buttons = [];
      KNOWN_BUTTONS.forEach(function (item) {
        visibility[item.key] = item.defaultVisible;
        buttons.push({
          key: item.key,
          label: item.label,
          plugin: item.plugin,
          defaultVisible: item.defaultVisible
        });
      });
      return { visibility: visibility, buttons: buttons };
    }

    function loadState() {
      var base = defaultState();
      try {
        var raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return base;
        var parsed = JSON.parse(raw);
        if (parsed && typeof parsed === "object" && parsed.visibility && parsed.buttons) {
          return {
            visibility: Object.assign({}, base.visibility, parsed.visibility),
            buttons: mergeButtons(base.buttons, parsed.buttons)
          };
        }
        return {
          visibility: Object.assign({}, base.visibility, parsed),
          buttons: base.buttons
        };
      } catch (e) {
        return base;
      }
    }

    function mergeButtons(base, extra) {
      var map = {};
      base.concat(extra || []).forEach(function (btn) {
        if (!btn || !btn.key) return;
        if (!map[btn.key]) map[btn.key] = btn;
      });
      return Object.keys(map).map(function (key) { return map[key]; });
    }

    function saveState(state) {
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (e) {}
    }

    function scanHeaderButtons() {
      var found = [];
      var containers = document.querySelectorAll(SLOT_SELECTOR);
      Array.prototype.forEach.call(containers, function (container) {
        var buttons = container.querySelectorAll("button");
        Array.prototype.forEach.call(buttons, function (btn) {
          var label = labelForButton(btn);
          if (!label) return;
          var key = keyForButton(btn);
          var known = knownForButton(btn);
          var plugin = known ? known.plugin : pluginForButton(btn);
          var defaultVisible = known ? known.defaultVisible : true;
          if (!found.some(function (item) { return item.key === key; })) {
            found.push({
              key: key,
              label: label,
              plugin: plugin,
              defaultVisible: defaultVisible
            });
          }
        });
      });
      return found;
    }

    function applyVisibility(state) {
      var rules = [];
      KNOWN_BUTTONS.forEach(function (item) {
        if (state.visibility[item.key] === false) {
          rules.push(item.selector + " { display: none !important; }");
        }
      });
      var tag = document.getElementById("dsh-topbar-manager-style");
      if (!tag) {
        tag = document.createElement("style");
        tag.id = "dsh-topbar-manager-style";
        document.head.appendChild(tag);
      }
      tag.textContent = rules.join("\n");

      var containers = document.querySelectorAll(SLOT_SELECTOR);
      Array.prototype.forEach.call(containers, function (container) {
        var buttons = container.querySelectorAll("button");
        Array.prototype.forEach.call(buttons, function (btn) {
          var key = keyForButton(btn);
          if (state.visibility[key] === false) {
            btn.style.display = "none";
          } else if (btn.style && btn.style.display === "none") {
            btn.style.display = "";
          }
        });
      });
    }

    function apply(ctx) {
      var state = loadState();
      applyVisibility(state);
      injectSettingsStyle();

      ctx.effect(function () {
        return function () {
          var tag = document.getElementById("dsh-topbar-manager-style");
          if (tag) tag.remove();
          var settingsTag = document.getElementById("dsh-topbar-manager-settings-style");
          if (settingsTag) settingsTag.remove();
        };
      });

      ctx.slots.inject("settings.section", function () {
        return ctx.slots.register({
          name: "settings.section",
          id: "dsh-topbar-manager",
          order: 200,
          label: function () { return "顶部按钮管理"; }
        }, function TopbarManagerSettings() {
          var useState = React.useState;
          var initial = loadState();
          var stateRef = React.useRef(initial);
          var setTick = useState(0)[1];
          var message = useState("")[0];
          var setMessage = useState("")[1];

          function refresh() {
            var found = scanHeaderButtons();
            var current = loadState();
            var merged = mergeButtons(current.buttons, found);
            found.forEach(function (btn) {
              if (current.visibility[btn.key] === undefined) {
                current.visibility[btn.key] = btn.defaultVisible;
              }
            });
            var next = { visibility: current.visibility, buttons: merged };
            saveState(next);
            stateRef.current = next;
            applyVisibility(next);
            setTick(function (n) { return n + 1; });
            setMessage("检查完成，发现 " + found.length + " 个顶部按钮");
          }

          function toggle(key, visible) {
            var current = loadState();
            current.visibility[key] = visible;
            saveState(current);
            stateRef.current = current;
            applyVisibility(current);
            setTick(function (n) { return n + 1; });
          }

          var state = stateRef.current;

          return React.createElement("div", { className: "dshtm-settings" },
            React.createElement("div", { className: "dshtm-card" },
              React.createElement("div", { className: "dshtm-header" },
                React.createElement("div", null,
                  React.createElement("h3", null, "顶部按钮管理"),
                  React.createElement("p", null, "控制插件添加到顶部工具栏的按钮显示状态。")
                ),
                React.createElement("button", {
                  type: "button",
                  className: "dshtm-check-btn",
                  onClick: refresh
                }, "检查")
              ),
              message ? React.createElement("div", { className: "dshtm-message" }, message) : null,
              React.createElement("div", { className: "dshtm-list" },
                state.buttons.map(function (btn) {
                  var visible = state.visibility[btn.key] !== false;
                  return React.createElement("div", { key: btn.key, className: "dshtm-row" },
                    React.createElement("div", { className: "dshtm-info" },
                      React.createElement("span", { className: "dshtm-label" }, btn.label),
                      React.createElement("span", { className: "dshtm-plugin" }, btn.plugin)
                    ),
                    React.createElement("label", { className: "dshtm-switch" },
                      React.createElement("input", {
                        type: "checkbox",
                        checked: visible,
                        onChange: function (e) { toggle(btn.key, e.target.checked); }
                      }),
                      React.createElement("span", { className: "dshtm-slider" })
                    )
                  );
                })
              )
            )
          );
        });
      });
    }

    exports.apply = apply;
    exports.inject = ["slots"];
    return module.exports;
  }
});
