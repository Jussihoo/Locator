/*
 * @class Control.Targets
 * @aka L.Control.Targets
 * @inherits Control
 *
 * The target control gives users the ability to select which user if followed (mymap.setView) on the map. 
 * 
 */


L.Control.Targets = L.Control.extend({
	// Control.Target options
	options: {
		// @option collapsed: Boolean = true
		// If `true`, the control will be collapsed into an icon and expanded on mouse hover or touch.
		collapsed: true,
		position: 'bottomright',
  },

	initialize: function (options) {
		L.setOptions(this, options);
    
		this._handlingClick = false;
	},

	onAdd: function (map) {
		
    this._initLayout();
    // Create "No target" radiobutton
    this._addNoTarget();
    this._map = map;
    this._checked = "";
    map.on('zoomend', this)
		return this._container;
	},

	onRemove: function () {
  // ToDo
	},
  

	// Adds a target (radio button entry) with the given name to the control.
	addTarget: function (locatorID) {
    var checked = false;
		this._addTarget(locatorID, checked);
		return;
},

  // Removes a target (radio button entry)
	removeTarget: function () {
		this._update();
		return;
},


	// @method expand(): this
	// Expand the control container if collapsed.
	expand: function () {
		L.DomUtil.addClass(this._container, 'leaflet-control-targets-expanded');
		this._form.style.height = null;
		var acceptableHeight = this._map.getSize().y - (this._container.offsetTop + 50);
		if (acceptableHeight < this._form.clientHeight) {
			L.DomUtil.addClass(this._form, 'leaflet-control-targets-scrollbar');
			this._form.style.height = acceptableHeight + 'px';
		} else {
			L.DomUtil.removeClass(this._form, 'leaflet-control-targets-scrollbar');
		}
		return this;
	},

	// @method collapse(): this
	// Collapse the control container if expanded.
	collapse: function () {
		L.DomUtil.removeClass(this._container, 'leaflet-control-targets-expanded');
		return this;
	},
  
  _initLayout: function () {
		var className = 'leaflet-control-targets',
        container = this._container = L.DomUtil.create('div', className)

		// makes this work on IE touch devices by stopping it from firing a mouseout event when the touch is released
		container.setAttribute('aria-haspopup', true);

		L.DomEvent.disableClickPropagation(container);
		if (!L.Browser.touch) {
			L.DomEvent.disableScrollPropagation(container);
		}

		var form = this._form = L.DomUtil.create('form', className + '-list');

		if (this.options.collapsed) {
			if (!L.Browser.android) {
				L.DomEvent.on(container, {
					mouseenter: this.expand,
					mouseleave: this.collapse
				}, this);
			}

			var link = this._layersLink = L.DomUtil.create('a', className + '-toggle', container);
			link.href = '#';
			link.title = 'Targets';

			if (L.Browser.touch) {
				L.DomEvent
				    .on(link, 'click', L.DomEvent.stop)
				    .on(link, 'click', this.expand, this);
			} else {
				L.DomEvent.on(link, 'focus', this.expand, this);
			}

			// work around for Firefox Android issue https://github.com/Leaflet/Leaflet/issues/2033
			L.DomEvent.on(form, 'click', function () {
				setTimeout(L.bind(this._onInputClick, this), 0);
			}, this);

			this._map.on('click', this.collapse, this);
			// TODO keyboard accessibility
		} else {
			this.expand();
		}

		this._targetList = L.DomUtil.create('div', className + '-items', form);

		container.appendChild(form);
    
},

  _update: function () {
		if (!this._container) { return this; }

		L.DomUtil.empty(this._targetList);
    this._addNoTarget();
		for (i = 0; i < locators.length; i++) {
      checked = locators[i].bTarget;
			this._addTarget(i, checked);
		}
		return this;
},
  
   // Add a new target to the radiobutton list
  _addNoTarget: function() {
     
    var label = document.createElement('label'),
		    checked = true,
		    input;

		input = this._createRadioElement('leaflet-locator-targets', checked);
		input.targetId = 666;
		L.DomEvent.on(input, 'click', this._onInputClick, this);

		var name = document.createElement('span');
		name.innerHTML = ' no target';

		// Helps from preventing layer control flicker when checkboxes are disabled
		// https://github.com/Leaflet/Leaflet/issues/2771
		var holder = document.createElement('div');

		label.appendChild(holder);
		holder.appendChild(input);
		holder.appendChild(name);
    var container = this._targetList;
		container.appendChild(label);
    return label;
  },

   // Add a new target to the radiobutton list
  _addTarget: function(locationID, checked) {
     
    var label = document.createElement('label'),
		    input;

		input = this._createRadioElement('leaflet-locator-targets', checked);
		input.targetId = locationID;
		L.DomEvent.on(input, 'click', this._onInputClick, this);

		var name = document.createElement('span');
    name.innerHTML = "<img class='target-icon' src='"+locators[locationID].object.icon.options.iconUrl+"' /> <span class='my-target-item'>"+locators[locationID].name+"</span>";

		// Helps from preventing layer control flicker when checkboxes are disabled
		// https://github.com/Leaflet/Leaflet/issues/2771
		var holder = document.createElement('div');

		label.appendChild(holder);
		holder.appendChild(input);
		holder.appendChild(name);
    var container = this._targetList;
		container.appendChild(label);
    return label;
  },

	// IE7 bugs out if you create a radio dynamically, so you have to do it this hacky way (see http://bit.ly/PqYLBe)
	_createRadioElement: function (name, checked) {

		var radioHtml = '<input type="radio" class="leaflet-control-targets-selector" name="' +
				name + '"' + (checked ? ' checked="checked"' : '') + '/>';

		var radioFragment = document.createElement('div');
		radioFragment.innerHTML = radioHtml;

		return radioFragment.firstChild;
	},
  
  _onInputClick: function () {
		var inputs = this._form.getElementsByTagName('input'),
		    target;
	
		this._handlingClick = true;
    
    for (var i = inputs.length - 1; i >= 0; i--) {
      input = inputs[i];
      if (input.checked && input.targetId == 666 ) { // this is the "No target"
          for (var i=0; i<locators.length; i++){ // set all the locators to be not followed
            locators[i].bTarget = false;
          }
          break;
      }
      else if (input.checked && input.targetId != 666) {
          locators[input.targetId].bTarget = true; // set view to target to this locator
          // get the coordinates of the last marker
          var latlon = locators[input.targetId].object.marker.getLatLng();
          var lat = latlon['lat'];
          var lon = latlon['lng']; 
          // set the view immediately to the last marker
          mymap.setView([lat, lon]);
          break;  
      } 
    }
    

		this._handlingClick = false;

		this._refocusOnMap();
    this.collapse();
},

	_expand: function () {
		// Backward compatibility, remove me in 1.1.
		return this.expand();
	},

	_collapse: function () {
		// Backward compatibility, remove me in 1.1.
		return this.collapse();
	}

});

// @factory L.control.targets(Object, options?: Control.Layers options)
L.control.targets = function (options) {
	return new L.Control.Targets(options);
};
