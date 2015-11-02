// Copyright (c) 2010-2013 Quadralay Corporation.  All rights reserved.
//
// ePublisher 2013.1
//
// Validated with JSLint <http://www.jslint.com/>
//

/*jslint maxerr: 50, indent: 4 */
/*global window */


// Message
//

var Message = {};

Message.Determine_Origin = function (param_window) {
    'use strict';

    var result, end_index;

    if (param_window.location.protocol === 'file:') {
        result = '*';
    } else {
        end_index = param_window.location.href.indexOf(param_window.location.pathname);
        result = param_window.location.href.substring(0, end_index);
    }

    return result;
};

Message.Listen = function (param_window, param_function) {
    'use strict';

    var origin, middleware;

    // Use appropriate browser method
    //
    if ((param_window.postMessage !== undefined) && (param_window.JSON !== undefined)) {
        // Wrap function to ensure security
        //
        origin = Message.Determine_Origin(param_window);
        middleware = function (param_event) {
            var accept, event, key;

            // Ensure origin matches
            //
            accept = (param_event.origin === origin);
            if (!accept) {
                if (param_window.location.protocol === 'file:') {
                    accept = (param_event.origin.indexOf('file:') === 0);
                    if (!accept) {
                        accept = (param_event.origin === 'null');
                    }
                }
            }

            // Invoke function if message acceptable
            //
            if (accept) {
                // Copy existing event
                //
                event = {};
                for (key in param_event) {
                    if (param_event[key] !== undefined) {
                        event[key] = param_event[key];
                    }
                }

                // Expand JSON data
                //
                try {
                    event.data = param_window.JSON.parse(param_event.data);
                    param_function(event);
                } catch (ignore) {
                    // Apparently, this message wasn't meant for us
                    //
                }
            }
        };

        if (param_window.addEventListener !== undefined) {
            // Via postMessage
            //
            param_window.addEventListener('message', middleware, false);
        } else if (param_window.attachEvent !== undefined) {
            // Via postMessage
            //
            param_window.attachEvent('onmessage', middleware, false);
        }
    } else {
        // Direct send
        //
        if (!param_window.POSTMESSAGE_message) {
            param_window.POSTMESSAGE_message = param_function;
        }
    }
};

Message.Post = function (param_to_window, param_data, param_from_window) {
    'use strict';

    var data, origin, event;

    // Use appropriate browser method
    //
    if ((param_from_window.postMessage !== undefined) && (param_from_window.JSON !== undefined)) {
        // Via postMessage
        //
        data = param_from_window.JSON.stringify(param_data);
        origin = Message.Determine_Origin(param_from_window);
        param_to_window.postMessage(data, origin);
    } else {
        // Direct send
        //
        if (param_to_window.POSTMESSAGE_message) {
            event = { 'origin': origin, 'source': param_from_window, 'data': param_data };
            param_from_window.setTimeout(function () {
                param_to_window.POSTMESSAGE_message(event);
            }, 1);
        }
    }
};


// ExecuteWithDelay
//

function ExecuteWithDelay(param_window, param_callback, param_delay) {
    'use strict';

    var this_executewithdelay;

    this_executewithdelay = this;

    this.timeout = null;
    this.Execute = function () {
        // Pending invocation?
        //
        if (this_executewithdelay.timeout !== null) {
            // Reset timer and prepare to start over
            //
            param_window.clearTimeout(this_executewithdelay.timeout);
        }

        // Start timer
        //
        this_executewithdelay.timeout = param_window.setTimeout(this_executewithdelay.Invoke, param_delay);
    };
    this.Invoke = function () {
        try {
            // Clear timeout tracker and invoke callback
            //
            this_executewithdelay.timeout = null;
            param_callback();
        } catch (ignore) {
            // Ignore callback exceptions
            //
        }
    };
}


// Tracker
//

function Tracker(param_window, param_element, param_callback) {
    'use strict';

    var this_tracker;

    this.element = param_element;
    this.snapshot = param_element.innerHTML;
    this.snapshot_growing = false;

    this_tracker = this;
    this.Execute = function () {
        var snapshot;

        try {
            // Snapshot changed?
            //
            snapshot = this_tracker.element.innerHTML;
            if (snapshot !== this_tracker.snapshot) {
                this_tracker.snapshot = snapshot;
                this_tracker.snapshot_growing = true;
            } else {
                // Previously growing?
                //
                if (this_tracker.snapshot_growing) {
                    this_tracker.snapshot_growing = false;

                    // Invoke callback
                    //
                    try {
                        param_callback();
                    } catch (ignore) {
                        // Ignore callback exceptions
                        //
                    }
                }
            }

            // Continue
            //
            param_window.setTimeout(function () { this_tracker.Execute(); }, 200);
        } catch (ignore) {
            // Element must no longer be valid
            //
        }
    };
}


// Browser
//

var Browser = {};

Browser.ScrollingSupported = function () {
    'use strict';

    var result, safari_match, mobile_match, version_match;

    // Initialize return value
    //
    result = true;

    // Older mobile browsers, such as Safari under iOS 5 and earlier
    // do not support scrolling of nested overflowed divs or iframes
    //
    // Mozilla/5.0 (iPhone; CPU iPhone OS 6_1_3 like Mac OS X) AppleWebKit/536.26 (KHTML, like Gecko) Version/6.0 Mobile/10B329 Safari/8536.25
    //
    safari_match = window.navigator.userAgent.match(/ Safari\//);
    mobile_match = window.navigator.userAgent.match(/ Mobile\//);
    version_match = window.navigator.userAgent.match(/ Version\/(\d+)\.(\d+) /);
    if ((safari_match !== null) && (mobile_match !== null) && (version_match !== null) && (parseInt(version_match[1], 10) < 6)) {
        result = false;
    }

    return result;
};

Browser.GetAJAX = function (param_window) {
    'use strict';

    var result;

    try {
        // Firefox, Opera, Safari, Chrome
        //
        result = new param_window.XMLHttpRequest();
    } catch (e1) {
        // IE
        //
        try {
            result = new param_window.ActiveXObject('Msxml2.XMLHTTP');
        } catch (e2) {
            result = new param_window.ActiveXObject('Microsoft.XMLHTTP');
        }
    }

    return result;
};

Browser.ContainsClass = function (param_className, param_class) {
    'use strict';

    var result, index;

    result = false;

    if ((param_className !== undefined) && (param_className.length > 0) && (param_class.length > 0)) {
        // Exact match?
        //
        if (param_class === param_className) {
            result = true;
        } else {
            // Contains?
            //
            index = param_className.indexOf(param_class);
            if (index >= 0) {
                if (index === 0) {
                    result = (param_className.charAt(param_class.length) === ' ');
                } else if (index === (param_className.length - param_class.length)) {
                    result = (param_className.charAt(index - 1) === ' ');
                } else {
                    result = ((param_className.charAt(index - 1) === ' ') && (param_className.charAt(index + param_class.length) === ' '));
                }
            }
        }
    }

    return result;
};

Browser.AddClass = function (param_className, param_class) {
    'use strict';

    var result;

    result = param_className;
    if (!Browser.ContainsClass(param_className, param_class)) {
        result = param_className + ' ' + param_class;
    }

    return result;
};

Browser.RemoveClass = function (param_className, param_class) {
    'use strict';

    var result, index;

    result = param_className;
    if ((param_className !== undefined) && (param_className.length > 0) && (param_class.length > 0)) {
        // Exact match?
        //
        if (param_class === param_className) {
            result = '';
        } else {
            // Contains?
            //
            index = param_className.indexOf(param_class);
            if (index >= 0) {
                if (index === 0) {
                    if (param_className.charAt(param_class.length) === ' ') {
                        result = param_className.substring(param_class.length + 1);
                    }
                } else if (index === (param_className.length - param_class.length)) {
                    if (param_className.charAt(index - 1) === ' ') {
                        result = param_className.substring(0, index - 1);
                    }
                } else {
                    if ((param_className.charAt(index - 1) === ' ') && (param_className.charAt(index + param_class.length) === ' ')) {
                        result = param_className.substring(0, index - 1) + param_className.substring(index + param_class.length);
                    }
                }
            }
        }
    }

    return result;
};

Browser.ReplaceClass = function (param_className, param_existing_class, param_new_class) {
    'use strict';

    var result;

    result = Browser.RemoveClass(param_className, param_existing_class);
    result = Browser.AddClass(result, param_new_class);

    return result;
};

Browser.SameDocument = function (param_url_1, param_url_2) {
    'use strict';

    var result, current_path, desired_path;

    result = false;

    if (param_url_1 === param_url_2) {
        // Quick and dirty check
        //
        result = true;
    } else {
        // Try more in-depth test
        //
        current_path = param_url_1;
        desired_path = param_url_2;

        // Decompose hrefs
        //
        if (current_path.indexOf('#') !== -1) {
            current_path = current_path.substring(0, current_path.indexOf('#'));
        }
        if (desired_path.indexOf('#') !== -1) {
            desired_path = desired_path.substring(0, desired_path.indexOf('#'));
        }

        // Same document?
        //
        if ((desired_path === current_path) || (decodeURI(desired_path) === current_path) || (desired_path === decodeURI(current_path)) || (decodeURI(desired_path) === decodeURI(current_path))) {
            result = true;
        }
    }

    return result;
};

Browser.SameHierarchy = function (param_base_url, param_test_url) {
    'use strict';

    var result, decoded_base_url, decoded_test_url;

    result = false;

    if (param_test_url.indexOf(param_base_url) === 0) {
        result = true;
    } else {
        decoded_base_url = decodeURI(param_base_url);

        if (param_test_url.indexOf(decoded_base_url) === 0) {
            result = true;
        } else {
            decoded_test_url = decodeURI(param_test_url);

            if (decoded_test_url.indexOf(param_base_url) === 0) {
                result = true;
            } else {
                if (decoded_test_url.indexOf(decoded_base_url) === 0) {
                    result = true;
                }
            }
        }
    }

    return result;
};

Browser.RelativePath = function (param_base_url, param_test_url) {
    'use strict';

    var result, decoded_base_url, decoded_test_url;

    result = '';

    if (param_test_url.indexOf(param_base_url) === 0) {
        result = param_test_url.substring(param_base_url.length);
    } else {
        decoded_base_url = decodeURI(param_base_url);

        if (param_test_url.indexOf(decoded_base_url) === 0) {
            result = param_test_url.substring(decoded_base_url.length);
        } else {
            decoded_test_url = decodeURI(param_test_url);

            if (decoded_test_url.indexOf(param_base_url) === 0) {
                result = decoded_test_url.substring(param_base_url.length);
            } else {
                if (decoded_test_url.indexOf(decoded_base_url) === 0) {
                    result = decoded_test_url.substring(decoded_base_url.length);
                }
            }
        }
    }

    return result;
};

Browser.ResolveURL = function (param_reference_page_url, param_url) {
    'use strict';

    var result, url_parts, resolved_url_parts, url_component;

    // Absolute URL?
    //
    if (param_url.indexOf('//') >= 0) {
        // Absolute URL
        //
        result = param_url;
    } else {
        // Relative URL
        //

        // Expand URL into components
        //
        if (param_url.indexOf('/') >= 0) {
            url_parts = param_url.split('/');
        } else {
            url_parts = [ param_url ];
        }
        resolved_url_parts = param_reference_page_url.split('/');
        resolved_url_parts.length = resolved_url_parts.length - 1;

        // Process URL components
        //
        while (url_parts.length > 0) {
            url_component = url_parts.shift();

            if ((url_component !== '') && (url_component !== '.')) {
                if (url_component === '..') {
                    resolved_url_parts.pop();
                } else {
                    resolved_url_parts.push(url_component);
                }
            }
        }

        // Build resolved URL
        //
        result = resolved_url_parts.join('/');
    }

    return result;
};

Browser.GetDocument = function (param_iframe_or_window) {
    'use strict';

    var result;

    try {
        // <iframe>?
        //
        result = param_iframe_or_window.contentWindow || param_iframe_or_window.contentDocument;
        if (result.document) {
            result = result.document;
        }
    } catch (e) {
        try {
            // window?
            //
            result = param_iframe_or_window.document;
        } catch (ignore) {
            // Give up!
            //
        }
    }

    try {
        if (result.location.href === undefined) {
            result = undefined;
        } else if (result.body === undefined) {
            result = undefined;
        }
    } catch (e3) {
        result = undefined;
    }

    return result;
};

Browser.GetBrowserWidthHeight = function (param_window) {
    'use strict';

    var result;

    result = { width: 0, height: 0 };

    // Determine browser width/height
    //
    if ((param_window.document.documentElement !== undefined) && (param_window.document.documentElement.clientWidth !== 0)) {
        result.width = param_window.document.documentElement.clientWidth;
        result.height = param_window.document.documentElement.clientHeight;
    } else {
        result.width = param_window.document.body.clientWidth;
        result.height = param_window.document.body.clientHeight;
    }

    return result;
};

Browser.GetElementWidthHeight = function (param_element) {
    'use strict';

    var result;

    result = { width: 0, height: 0 };

    // Determine content width/height
    //
    if ((param_element.scrollWidth !== undefined) && (param_element.scrollHeight !== undefined)) {
        result.width = param_element.scrollWidth;
        result.height = param_element.scrollHeight;
        if ((param_element.offsetWidth !== undefined) && (param_element.offsetHeight !== undefined)) {
            if (param_element.offsetWidth > param_element.scrollWidth) {
                result.width = param_element.offsetWidth;
            }
            if (param_element.offsetHeight > param_element.scrollHeight) {
                result.height = param_element.offsetHeight;
            }
        }
    }

    return result;
};

Browser.GetElementScrollPosition = function (param_element, param_stop_at_element) {
    'use strict';

    var result, scroll_left, scroll_top, current_element;

    scroll_left = 0;
    scroll_top = 0;
    current_element = param_element;
    while ((current_element !== null) && (current_element !== param_stop_at_element)) {
        scroll_left += current_element.offsetLeft;
        scroll_top += current_element.offsetTop;

        current_element = current_element.offsetParent;
    }

    result = { 'left': scroll_left, 'top': scroll_top };

    return result;
};

Browser.GetWindowContentWidthHeight = function (param_window) {
    'use strict';

    var result, window_document, element;

    result = { width: 0, height: 0 };

    // Determine iframe width/height
    //
    window_document = Browser.GetDocument(param_window);
    if (window_document !== undefined) {
        // Default width/height info
        //
        element = window_document.body;
        result.width = element.offsetWidth;
        result.height = element.offsetHeight;

        if ((window_document.documentElement !== undefined) && (window_document.documentElement.offsetWidth !== 0)) {
            // Improve upon existing width/height info
            //
            if (window.navigator.userAgent.indexOf('MSIE') === -1) {
                element = window_document.documentElement;
                if (element.offsetWidth > result.width) {
                    result.width = element.offsetWidth;
                }
                if (element.offsetHeight > result.height) {
                    result.height = element.offsetHeight;
                }
            }
        }
    }

    return result;
};

Browser.GetIFrameContentWidthHeight = function (param_iframe) {
    'use strict';

    var result;

    // Determine iframe width/height
    //
    result = Browser.GetWindowContentWidthHeight(param_iframe);

    return result;
};

Browser.FindParentWithTagName = function (param_element, param_tag_name) {
    'use strict';

    var result, parent_element;

    result = null;

    try {
        parent_element = param_element.parentNode;
        while ((result === null) && (parent_element !== undefined) && (parent_element !== null)) {
            // Found target element?
            //
            if (parent_element.nodeName.toLowerCase() === param_tag_name) {
                // Success!
                //
                result = parent_element;
            }

            // Advance
            //
            parent_element = parent_element.parentNode;
        }
    } catch (ignore) {
        // No luck!
        //
    }

    return result;
};

Browser.FirstChildElement = function (param_element) {
    'use strict';

    var result, child_node;

    result = null;

    if ((param_element.firstChild !== undefined) && (param_element.firstChild !== null)) {
        child_node = param_element.firstChild;
        while ((child_node !== null)) {
            if (child_node.nodeType === 1) {
                result = child_node;
                break;
            } else {
                child_node = Browser.NextSiblingElement(child_node);
            }
        }
    }

    return result;
};

Browser.FirstChildElementWithTagName = function (param_element, param_tag_name) {
    'use strict';

    var result, child_node;

    result = null;

    if ((param_element.firstChild !== undefined) && (param_element.firstChild !== null)) {
        child_node = param_element.firstChild;
        while ((child_node !== null)) {
            if ((child_node.nodeType === 1) && (child_node.nodeName.toLowerCase() === param_tag_name)) {
                result = child_node;
                break;
            } else {
                child_node = Browser.NextSiblingElement(child_node);
            }
        }
    }

    return result;
};

Browser.PreviousSiblingElement = function (param_element) {
    'use strict';

    var result, current_element;

    result = null;

    current_element = param_element;
    while ((current_element.previousSibling !== undefined) && (current_element.previousSibling !== null)) {
        if (current_element.previousSibling.nodeType === 1) {
            result = current_element.previousSibling;
            break;
        }

        current_element = current_element.previousSibling;
    }

    return result;
};

Browser.NextSiblingElement = function (param_element) {
    'use strict';

    var result, current_element;

    result = null;

    current_element = param_element;
    while ((current_element.nextSibling !== undefined) && (current_element.nextSibling !== null)) {
        if (current_element.nextSibling.nodeType === 1) {
            result = current_element.nextSibling;
            break;
        }

        current_element = current_element.nextSibling;
    }

    return result;
};

Browser.PreviousSiblingElementWithTagName = function (param_element, param_tag_name) {
    'use strict';

    var result;

    result = Browser.PreviousSiblingElement(param_element);
    while ((result !== null) && (result.nodeName.toLowerCase() !== param_tag_name)) {
        result = Browser.PreviousSiblingElement(result);
    }

    return result;
};

Browser.NextSiblingElementWithTagName = function (param_element, param_tag_name) {
    'use strict';

    var result;

    result = Browser.NextSiblingElement(param_element);
    while ((result !== null) && (result.nodeName.toLowerCase() !== param_tag_name)) {
        result = Browser.NextSiblingElement(result);
    }

    return result;
};

Browser.GetAttribute = function (param_element, param_attribute_name) {
    'use strict';

    var result;

    result = null;

    // Notes on browser compatibility
    // http://help.dottoro.com/ljhutuuj.php
    //
    if (param_element.getAttribute !== undefined) {
        result = param_element.getAttribute(param_attribute_name);
    } else if (param_element.getPropertyValue !== undefined) {
        result = param_element.getPropertyValue(param_attribute_name);
    } else {
        if ((param_element[param_attribute_name] !== undefined) && (param_element[param_attribute_name] !== null)) {
            result = param_element[param_attribute_name];
        }
    }

    return result;
};

Browser.SetAttribute = function (param_element, param_attribute_name, param_value) {
    'use strict';

    // Notes on browser compatibility
    // http://help.dottoro.com/ljhutuuj.php
    //
    if (param_element.setAttribute !== undefined) {
        param_element.setAttribute(param_attribute_name, param_value);
    } else if (param_element.setProperty !== undefined) {
        param_element.setProperty(param_attribute_name, param_value);
    } else {
        param_element[param_attribute_name] = param_value;
    }
};

Browser.RemoveAttribute = function (param_element, param_attribute_name, param_empty_value) {
    'use strict';

    var attribute_value;

    // Attribute exists?
    //
    attribute_value = Browser.GetAttribute(param_element, param_attribute_name);
    if ((attribute_value !== null) && (attribute_value !== param_empty_value)) {
        // Notes on browser compatibility
        // http://help.dottoro.com/ljhutuuj.php
        //
        if (param_element.removeAttribute !== undefined) {
            param_element.removeAttribute(param_attribute_name);
        } else if (param_element.removeProperty !== undefined) {
            param_element.removeProperty(param_attribute_name);
        } else {
            param_element[param_attribute_name] = param_empty_value;
        }
    }
};

Browser.GetLinkRelHREF = function (param_document, param_rel) {
    'use strict';

    var result, link_elements, index, link_element;

    result = '';

    link_elements = param_document.getElementsByTagName('link');
    for (index = 0; index < link_elements.length; index += 1) {
        link_element = link_elements[index];
        if (link_element.rel === param_rel) {
            // HREF defined?
            //
            if (link_element.href !== undefined) {
                result = link_element.href;
            }
            break;
        }
    }

    return result;
};

Browser.ApplyToChildElementsWithTagName = function (param_element, param_tag_name, param_process) {
    'use strict';

    var elements, index, element;

    elements = param_element.getElementsByTagName(param_tag_name);
    for (index = 0; index < elements.length; index += 1) {
        element = elements[index];

        param_process(element);
    }
};

Browser.TrackSubtreeChanges = function (param_window, param_element, param_callback) {
    'use strict';

    var tracker, executewithdelay;

    // Address IE short-comings
    //
    if (param_window.navigator.userAgent.indexOf('MSIE') !== -1) {
        // Periodically track changes
        //
        tracker = new Tracker(param_window, param_element, param_callback);
        param_window.setTimeout(tracker.Execute, 1);
    } else {
        executewithdelay = new ExecuteWithDelay(param_window, param_callback, 100);
        if (param_element.addEventListener !== undefined) {
            param_element.addEventListener('DOMSubtreeModified', executewithdelay.Execute, false);
        } else if (param_element.attachEvent !== undefined) {
            param_element.attachEvent('DOMSubtreeModified', executewithdelay.Execute);
        }
    }
};

Browser.TrackDocumentChanges = function (param_window, param_document, param_callback) {
    'use strict';

    Browser.TrackSubtreeChanges(param_window, param_document.body, param_callback);
};


// File AJAX
//

var FAJAX = {};

FAJAX.Open = function (method, url, async) {
    'use strict';

    this.url = url;
};

FAJAX.Send = function (param_data) {
    'use strict';

    // Need to inject iframe via innerHTML to support IE 7
    //
    this.iframe_container = this.window.document.createElement('div');
    this.iframe_container.id = 'fajax_iframe_container';
    this.iframe_container.fajax = this;
    this.iframe_container.style.visibility = 'hidden';
    this.window.document.body.appendChild(this.iframe_container);
    this.iframe_container.innerHTML = '<iframe src="' + this.url + '" onload="FAJAX.OnLoad(window.document);"></iframe>';
};

FAJAX.OnLoad = function (param_document) {
    'use strict';

    var iframe_container;

    iframe_container = param_document.getElementById('fajax_iframe_container');
    iframe_container.fajax.HandleLoad();
};

FAJAX.HandleLoad = function () {
    'use strict';

    var iframe, iframe_document, data;

    // Access iframe's content directly
    //
    try {
        iframe = this.iframe_container.getElementsByTagName('iframe')[0];
        iframe_document = Browser.GetDocument(iframe);
        data = iframe_document.body.innerHTML;
    } catch (ignore) {
        // No luck!
        //
    }

    // Try session storage
    //
    if (data === null || data === undefined || data === '') {
        if (this.window.Storage !== undefined) {
            data = this.window.sessionStorage['WebWorks_Connect_Data'];
            delete this.window.sessionStorage['WebWorks_Connect_Data'];
        }
    }

    this.window.document.body.removeChild(this.iframe_container);

    if (data !== null && data !== undefined) {
        this.readyState = 4;
        this.status = 200;
        this.responseText = data;
        this.onreadystatechange();
    } else {
        this.readyState = 4;
        this.status = 404;
        this.responseText = '';
        this.onreadystatechange();
    }
};

FAJAX.Object = function (param_window) {
    'use strict';

    this.window = param_window;
    this.readyState = 1;
    this.status = 404;
    this.responseText = '';
    this.iframe = undefined;
    this.url = '';

    this.open = FAJAX.Open;
    this.send = FAJAX.Send;
    this.HandleLoad = FAJAX.HandleLoad;
};


// Parcels
//

var Parcels = {};

Parcels.KnownParcelURL = function (param_parcel_prefixes, param_url) {
    'use strict';

    var result, parcel_base_url;

    result = false;

    for (parcel_base_url in param_parcel_prefixes) {
        if (typeof param_parcel_prefixes[parcel_base_url] === 'boolean') {
            if (Browser.SameHierarchy(parcel_base_url, param_url)) {
                result = true;
                break;
            }
        }
    }

    return result;
};

Parcels.KnownParcelBaggageURL = function (param_parcel_prefixes, param_url) {
    'use strict';

    var result, parcel_base_url, baggage_url;

    result = false;

    for (parcel_base_url in param_parcel_prefixes) {
        if (typeof param_parcel_prefixes[parcel_base_url] === 'boolean') {
            if (Browser.SameHierarchy(parcel_base_url, param_url)) {
                baggage_url = parcel_base_url + '/baggage/';
                result = Browser.SameHierarchy(baggage_url, param_url);
                break;
            }
        }
    }

    return result;
};
