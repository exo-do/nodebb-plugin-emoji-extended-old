(function () {
    var BOUNDARY_AFTER, BOUNDARY_BEFORE, Settings, SocketAdmin, SocketModules, constants, defaultConfig, emoji, emojiPath, execMapping, fs, getHandler, getRoute, initAdminRoute, initSockets, list, mapTests, nconf, path, pkg, refreshMappings, regexObject, regexObjectToRegExp, replaceRegex, settings, updateEmoji, updating;
    fs = require("fs"), path = require("path"), nconf = module.parent.require("nconf"), SocketModules = module.parent.require("./socket.io/modules"), SocketAdmin = module.parent.require("./socket.io/admin"), emoji = require("emoji-parser"), Settings = module.parent.require("../src/settings"), pkg = require("./package.json"), emojiPath = nconf.get("url") + "/plugins/nodebb-plugin-exodo-emojis/images", regexObject = function (regex) {
            var parts, res;
            return parts = /^\/(.*)\/([^\/]*)$/.exec(regex.toString()), res = {
                source: null != parts ? parts[1] : void 0,
                options: null != parts ? parts[2] : void 0
            }, null == res.source && (res.source = ""), null == res.options && (res.options = ""), res
        }, regexObjectToRegExp = function (regexObject) {
            return new RegExp(regexObject.source || "", regexObject.options || "")
        }, defaultConfig = {
            completion: {
                maxLines: 8,
                minChars: 0,
                prefix: "^|[^\\w\\)\\]\\}\\-+]"
            },
            fileSystemAccess: 1,
            mapping: {
                enabled: false,
                separatedBefore: {
                    no_mouth: regexObject(/:[-=]?#/i),
                    cry: regexObject(/:[-=]?[\*']\(/i),
                    grinning: regexObject(/:[-=]?\)/),
                    frowning: regexObject(/:[-=]?\(/),
                    sunglasses: regexObject(/[8b][-=]?[\|\)]/i),
                    wink: regexObject(/;[-=]?\)/),
                    relieved: regexObject(/;[-=]?\(/),
                    expressionless: regexObject(/:[-=]?\|/),
                    blush: regexObject(/:[-=]?\$|:&quot;/),
                    smirk: regexObject(/:\^\)/),
                    sleeping: regexObject(/[\|i][-=]?\)/),
                    pensive: regexObject(/\|[-=]?\(/),
                    mask: regexObject(/:[-=]?&amp;/),
                    trollface: regexObject(/;\/\)/),
                    rage: [regexObject(/:[-=]?@/), regexObject(/x[-=]?\(/i)],
                    confused: regexObject(/:[-=]?\?/),
                    question: regexObject(/\?\?\?/)
                },
                separatedBoth: {
                    heart: regexObject(/&lt;3/),
                    broken_heart: regexObject(/&lt;[\/\\\|!]3/),
                    laughing: regexObject(/x[-=]?d/i),
                    zzz: regexObject(/zzz/i),
                    eyes: regexObject(/o_o/i),
                    smiley: regexObject(/:[-=]?d/i),
                    hushed: regexObject(/:[-=]?o/i),
                    stuck_out_tongue_winking_eye: regexObject(/:[-=]?p/i),
                    confounded: regexObject(/:[-=]?s/i),
                    no_mouth: regexObject(/:[-=]?x/i)
                }
            },
            zoom: 48
        }, replaceRegex = /(^|<\/code>)([^<]*|<(?!code[^>]*>))*(<code[^>]*>|$)/g, emoji.init(path.dirname(module.filename) + "/emoji"), list = emoji.emoji.sort(), updating = !1, updateEmoji = function () {
            return !updating && settings.fileSystemAccess ? (updating = !0, emoji.update(function (err) {
                return null == err && (list = emoji.emoji.sort()), updating = !1
            })) : void 0
        }, settings = new Settings("emoji-extended", "0.4.1", defaultConfig, null, !1, !1), getRoute = function () {}, constants = Object.freeze({
            name: "Emoji Extended",
            admin: {
                route: "/plugins/emoji-extended",
                icon: "fa-smile-o"
            }
        }), initAdminRoute = function (router, middleware) {
            return router.get("/admin" + constants.admin.route, middleware.admin.buildHeader, function (req, res) {
                return res.render("admin" + constants.admin.route, {})
            }), router.get("/api/admin" + constants.admin.route, function (req, res) {
                return res.render("admin" + constants.admin.route, settings.get())
            })
        }, module.exports.adminBuild = function (custom_header, cb) {
            return custom_header.plugins.push({
                route: constants.admin.route,
                icon: constants.admin.icon,
                name: constants.name
            }), cb(null, custom_header)
        }, module.exports.appLoad = function (data, callback) {
            return initSockets(), initAdminRoute(data.router, data.middleware), callback()
        }, module.exports.composerHelp = function (helpMessage, callback) {
            var mappingEnabled;
            return mappingEnabled = settings.get("killSkype"), helpMessage += '<h2>Emoji Extended</h2>\n<p>\n  This forum has emoji enabled.<br>\n  Emoji begin and end with <code>:</code> like <code>:smile:</code>, <code>:wink:</code>, etc. For a full list see <a href="http://www.emoji-cheat-sheet.com">Emoji cheat sheet</a>.', mappingEnabled && (helpMessage += "<br>\nAlso some common shortens like <code>:)</code>, <code>:P</code>, <code>;)</code>, <code>:-)</code>, etc. can be used."), mappingEnabled += "</p>", callback(null, helpMessage)
        }, BOUNDARY_BEFORE = "^|\\s|<\\/?[\\w-]+>", BOUNDARY_AFTER = "<\\/?[\\w-]+>|\\s|$", mapTests = {}, refreshMappings = function () {
            var addBefore, addBoth, beforeAny, key, mappings, val, value, _i, _len, _ref, _ref1, _results;
            mapTests.separatedBeforeAny = null, mapTests.separatedBefore = [], mapTests.separatedBoth = [], mappings = settings.get("mapping"), beforeAny = "", addBefore = function (key, regexObj) {
                var options, _ref;
                return options = regexObj.options + ((null != (_ref = regexObjectToRegExp(regexObj)) ? _ref.global : void 0) ? "" : "g"), beforeAny && (beforeAny += "|"), beforeAny += regexObj.source, mapTests.separatedBefore.push({
                    key: ":" + key + "[$1]:",
                    regex: new RegExp("(" + regexObj.source + ")", options)
                })
            }, addBoth = function (key, regexObj) {
                var options, _ref;
                return options = regexObj.options + ((null != (_ref = regexObjectToRegExp(regexObj)) ? _ref.global : void 0) ? "" : "g"), mapTests.separatedBoth.push({
                    key: "$1:" + key + "[$2]:$3",
                    regex: new RegExp("(" + BOUNDARY_BEFORE + ")(" + regexObj.source + ")(" + BOUNDARY_AFTER + ")", options)
                })
            }, _ref = mappings.separatedBefore;
            for (key in _ref)
                if (value = _ref[key], value instanceof Array)
                    for (_i = 0, _len = value.length; _len > _i; _i++) val = value[_i], addBefore(key, val);
                else addBefore(key, value);
            mapTests.separatedBeforeAny = new RegExp("(?:" + BOUNDARY_BEFORE + ")(" + beforeAny + ")", "ig"), _ref1 = mappings.separatedBoth, _results = [];
            for (key in _ref1) value = _ref1[key], _results.push(value instanceof Array ? function () {
                var _j, _len1, _results1;
                for (_results1 = [], _j = 0, _len1 = value.length; _len1 > _j; _j++) val = value[_j], _results1.push(addBoth(key, val));
                return _results1
            }() : addBoth(key, value));
            return _results
        }, refreshMappings(), getHandler = function (tests) {
            return function (match) {
                var entry, m, _i, _len;
                for (_i = 0, _len = tests.length; _len > _i; _i++)
                    if (entry = tests[_i], m = match.replace(entry.regex, entry.key), m !== match) return m;
                return match
            }
        }, execMapping = function (content) {
            var entry, _i, _len, _ref;
            for (content = content.replace(mapTests.separatedBeforeAny, getHandler(mapTests.separatedBefore)), _ref = mapTests.separatedBoth, _i = 0, _len = _ref.length; _len > _i; _i++) entry = _ref[_i], content = content.replace(entry.regex, entry.key);
            return content
        },
        function () {
            var parse;
            return parse = function (content) {
                var mappingEnabled;
                return mappingEnabled = settings.get("mapping.enabled"), content.replace(replaceRegex, function (match) {
                    return emoji.parse(mappingEnabled ? execMapping(match) : match, emojiPath, {
                        classes: "emoji emoji-extended img-responsive",
                        attributes: {
                            title: function (match, name, parameter) {
                                return null != parameter ? parameter : name
                            },
                            alt: function (match, name, parameter) {
                                return null != parameter ? parameter : match
                            }
                        }
                    })
                })
            }, module.exports.parse = function (content, cb) {
                return "function" == typeof cb && cb(null, content = parse(content)), content
            }, module.exports.parseDataContent = function (data, cb) {
                var _ref;
                return null != (null != data && null != (_ref = data.postData) ? _ref.content : void 0) && (data.postData.content = parse(data.postData.content)), cb(null, data), data
            }
        }(), initSockets = function () {
            return SocketModules.emojiExtended = function (socket, data, cb) {
                return cb(null, {
                    settings: settings.get(),
                    list: list,
                    version: pkg.version
                })
            }, SocketAdmin.settings.syncEmojiExtended = function () {
                return settings.sync(function () {
                    return refreshMappings()
                })
            }, SocketAdmin.settings.getEmojiExtendedDefaults = function (socket, data, callback) {
                return callback(null, settings.createDefaultWrapper())
            }, SocketAdmin.settings.updateEmojiExtended = updateEmoji
        }
}).call(this);