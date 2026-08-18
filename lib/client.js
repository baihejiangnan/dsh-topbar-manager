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
      { key: "undo-buttons", label: "撤销/恢复/快照", plugin: "dsh-undo-savepoint", selector: '[data-undo-header]', defaultVisible: true },
      { key: "what-changed", label: "会话改动", plugin: "dsh-what-changed", selector: '.dwc-action', defaultVisible: true }
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
        if (!item.selector) continue;
        if (btn.matches && btn.matches(item.selector)) return item;
        if (btn.closest && btn.closest(item.selector)) return item;
      }
      return null;
    }

    function labelForButton(btn) {
      return (btn.textContent || btn.title || btn.getAttribute("aria-label") || "").trim();
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

    function stateFromValue(value) {
      var base = defaultState();
      var stored = value && value.visibility;
      if (stored && typeof stored === "object") {
        base.visibility = Object.assign({}, base.visibility, stored);
      }
      return base;
    }

    function readJsonResponse(response) {
      return response.text().then(function (text) {
        var body = {};
        if (text.trim() !== "") {
          try {
            body = JSON.parse(text);
          } catch (error) {
            throw new Error("服务端返回了无效响应 (" + response.status + ")");
          }
        }
        if (!response.ok) {
          throw new Error(body.error || "请求失败 (" + response.status + ")");
        }
        return body;
      });
    }

    function loadRemoteState() {
      return fetch("/topbar-manager/api/settings", {
        headers: { accept: "application/json" }
      }).then(readJsonResponse).then(stateFromValue);
    }

    function saveRemoteState(state) {
      return fetch("/topbar-manager/api/settings", {
        method: "POST",
        headers: { "content-type": "application/json", accept: "application/json" },
        body: JSON.stringify({ visibility: state.visibility })
      }).then(readJsonResponse).then(stateFromValue);
    }

    function scanHeaderButtons() {
      var found = [];
      var containers = document.querySelectorAll(SLOT_SELECTOR);
      Array.prototype.forEach.call(containers, function (container) {
        var buttons = container.querySelectorAll("button");
        Array.prototype.forEach.call(buttons, function (btn) {
          var known = knownForButton(btn);
          // Native DSH buttons (including Session log) and unknown buttons are
          // intentionally excluded: only buttons with an attributable plugin
          // selector are safe to record and control.
          if (!known || found.some(function (item) { return item.key === known.key; })) return;
          found.push({
            key: known.key,
            label: known.label || labelForButton(btn),
            plugin: known.plugin,
            defaultVisible: known.defaultVisible
          });
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
          var known = knownForButton(btn);
          if (!known) return;
          btn.style.display = state.visibility[known.key] === false ? "none" : "";
        });
      });
    }

    function apply(ctx) {
      var activeState = defaultState();
      applyVisibility(activeState);
      injectSettingsStyle();

      loadRemoteState().then(function (state) {
        activeState = state;
        applyVisibility(activeState);
      }).catch(function () {
        // The settings page reports transport errors; startup keeps defaults.
      });

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
          var stateState = useState(activeState);
          var state = stateState[0];
          var setState = stateState[1];
          var buttonsState = useState(defaultState().buttons);
          var buttons = buttonsState[0];
          var setButtons = buttonsState[1];
          var messageState = useState("");
          var message = messageState[0];
          var setMessage = messageState[1];

          React.useEffect(function () {
            var active = true;
            loadRemoteState().then(function (next) {
              if (!active) return;
              activeState = next;
              setState(next);
              applyVisibility(next);
            }).catch(function (error) {
              if (active) setMessage("读取设置失败：" + String(error && error.message || error));
            });
            return function () {
              active = false;
            };
          }, []);

          function refresh() {
            var found = scanHeaderButtons();
            setButtons(found);
            setMessage("检查完成，发现 " + found.length + " 个插件按钮；原生按钮已忽略");
          }

          function toggle(key, visible) {
            var next = {
              visibility: Object.assign({}, state.visibility),
              buttons: state.buttons
            };
            next.visibility[key] = visible;
            saveRemoteState(next).then(function (saved) {
              activeState = saved;
              setState(saved);
              applyVisibility(saved);
              setMessage("设置已保存");
            }).catch(function (error) {
              setMessage("保存失败：" + String(error && error.message || error));
            });
          }

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
                buttons.map(function (btn) {
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
