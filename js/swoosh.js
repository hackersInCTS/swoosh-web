// View models
var MapViewModel = function () {
    this.location = "New York, NY";
    this.zoom = 14;
    this.width = 288;
    this.height = 200;
    this.markers = ["New York, NY"];
    this.sensor = true;
    this.getMapUrl = function () {
        return 'https://maps.googleapis.com/maps/api/staticmap?center=' + this.location +
            '&zoom=' + this.zoom + '&size=' + this.width + 'x' + this.height +
            '&markers=' + this.markers.join('|') + '&sensor=' + this.sensor;
    };
};

var Swoosh = Swoosh || {};

Swoosh.Common = (function ($) {
    return {
        alert:function (message) {
            try {
                navigator.notification.alert(message, $.noop, "Swoosh");
            }
            catch (e) {
                alert(message);
            }
        },
        getQueryStringValue:function (name) {
            name = name.replace(/[\[]/, "\\\[").replace(/[\]]/, "\\\]");
            var regexS = "[\\?&]" + name + "=([^&#]*)";
            var regex = new RegExp(regexS);
            var results = regex.exec(window.location.search);
            if (results == null)
                return "";
            else
                return decodeURIComponent(results[1].replace(/\+/g, " "));
        },
        populateDropDown:function (dropdownId, items, selectedValue) {
            var dropdown = $(dropdownId);
            $('option', dropdown).remove();

            $(items).each(function (index, value) {
                    var o = new Option(value, value);
                    $(o).html(value);
                    dropdown.append(o);
                }
            );
            dropdown.selectmenu("refresh", true);
        }
    };
}(jQuery));

Swoosh.Home = (function ($) {
    return{
        populatePolicyData:function () {
            var policyData = $.parseJSON(Swoosh.Common.getQueryStringValue('policyJson'));
            $('#PolicyKey').text(policyData.PolicyKey);
            $('#VehicleMake').text(policyData.VehicleMake);
            $('#VehicleModel').text(policyData.VehicleModel);
            $('#VehicleVIN').text(policyData.VehicleVIN);
            $('#VehicleColor').text(policyData.VehicleColor);

            Swoosh.Common.populateDropDown('#select-choice-driver', policyData.Driver, policyData.PrimaryInsured);
            $('#select-choice-driver option:eq(' + policyData.PrimaryInsured + ')').prop('selected', true);

            var d = new Date();
            var dayIndex = d.getDate() + "";
            var monthIndex = d.getMonth() + "";
            var yearIndex = d.getFullYear() + "";
            var hourIndex = d.getHours() + "";
            var minuteIndex = d.getMinutes() + "";

            $('#select-choice-day option:eq(' + dayIndex + ')').prop('selected', true);
            $('#select-choice-month option:eq(' + monthIndex + ')').prop('selected', true);
            $('#select-choice-year option[value="' + yearIndex + '"]').prop('selected', true);

            $('#select-choice-hour option[value="' + hourIndex + '"]').prop('selected', true);
            $('#select-choice-minute option[value="' + minuteIndex + '"]').prop('selected', true);

            $('#select-choice-day').selectmenu("refresh", true);
            $('#select-choice-month').selectmenu("refresh", true);
            $('#select-choice-year').selectmenu("refresh", true);
            $('#select-choice-hour').selectmenu("refresh", true);
            $('#select-choice-minute').selectmenu("refresh", true);
        },
        goToMapPage:function () {
            Swoosh.Map.resetMaps();
            $.mobile.changePage($('#map'));
        }
    };
}(jQuery));

Swoosh.Map = (function ($) {
    return {
        initialize:function () {
            Swoosh.Map.getSpecificLocation();
        },
        resetMaps:function () {
            $('#mapPlotImg').attr('src', '');
            $('#LocationMarker').empty();
        },
        getSpecificLocation:function () {
            var userInput = $('#currentAddress').val();
            var onGeocodeSuccess = function (location) {
                var mapViewModel = new MapViewModel();
                $('#CurrentLocation').val(location.latitude + ', ' + location.longitude);
                mapViewModel.location = location.latitude + ', ' + location.longitude;
                mapViewModel.markers = [location.address];
                $('#LocationMarker').text(location.address);
                Swoosh.Map.plotMap(mapViewModel);
            };
            var onGeocodeError = function (mapViewModel) {
                return function (errorReason) {
                    console.log(errorReason);
                };
            };
            Swoosh.GoogleMaps.geocode(userInput, onGeocodeSuccess, onGeocodeError);
        },
        getCurrentPosition:function (onSuccess) {
            var onGetPositionError = function (error) {
                Swoosh.Common.alert('Code   : ' + error.code + '\n' +
                    'Message: ' + error.message + '\n');
            };
            var geoLocationOptions = {
                maximumAge:1000,
                timeout:3000,
                enableHighAccuracy:true
            };
            navigator.geolocation.getCurrentPosition(onSuccess, onGetPositionError, geoLocationOptions);
        },
        getCurrentPositionAndGeocode:function () {
            var onReverseGeocodeSuccess = function (mapViewModel) {
                return function (resolvedCity) {
                    $('#LocationMarker').text(resolvedCity);
                    $('#currentAddress').val(resolvedCity);

                };
            };
            var onReverseGeocodeError = function (mapViewModel) {
                return function (errorReason) {
                    console.log(errorReason);
//                    Swoosh.Map.plotMap(mapViewModel);
                };
            };
            var onGetPositionSuccess = function (position) {
                var mapViewModel = new MapViewModel();
                var location = position.coords.latitude + ', ' + position.coords.longitude;
                mapViewModel.location = location;
                mapViewModel.markers = [location];
                Swoosh.GoogleMaps.reverseGeocode(position.coords.latitude,
                    position.coords.longitude,
                    onReverseGeocodeSuccess(mapViewModel),
                    onReverseGeocodeError(mapViewModel));
            };
            Swoosh.Map.getCurrentPosition(onGetPositionSuccess);
        },
        getSpeedAndLocation:function () {
            var onGetSpeedAndLocationSuccess = function (position) {
                Swoosh.Common.alert('Latitude : ' + position.coords.latitude + '\n' +
                    'Longitude: ' + position.coords.longitude + '\n' +
                    'Speed    : ' + position.coords.speed + '\n');
            };
            Swoosh.Map.getCurrentPosition(onGetSpeedAndLocationSuccess);
        },
        plotMap:function (mapViewModel) {
            $('#mapPlotImg').attr('src', mapViewModel.getMapUrl());
        }
    };
}(jQuery));

Swoosh.GoogleMaps = (function ($) {
    return {
        geocode:function (address, onSuccess, onError) {
            var geoCoder = new google.maps.Geocoder();
            geoCoder.geocode({ 'address':address}, function (results, status) {
                if (status == google.maps.GeocoderStatus.OK) {
                    var location = {
                        longitude:results[0].geometry.location.lng,
                        latitude:results[0].geometry.location.lat,
                        address:results[0].formatted_address
                    };
                    onSuccess(location);
                } else {
                    onError('Geocode was not successful for the following reason: ' + status);
                }
            });
        },
        reverseGeocode:function (latitude, longitude, onSuccess, onError) {
            var latLong = new google.maps.LatLng(latitude, longitude);
            var geoCoder = new google.maps.Geocoder();
            geoCoder.geocode({
                'latLng':latLong
            }, function (results, status) {
                if (status == google.maps.GeocoderStatus.OK) {
                    if (results[4]) {
                        return onSuccess(results[4].formatted_address);
                    }
                } else {
                    onError("reverseGeocode failed due to: " + status);
                }
            });
        }
    };
}(jQuery));


Swoosh.Workflow = (function ($) {
    return {
        submit:function () {
                var LossDetails = Parse.Object.extend("LossDetails");
                var lossDetails = new LossDetails();
                lossDetails.save(
                    {
                        DeviceId: "",
                        PolicyKey: $('#PolicyKey').text(),
                        VehicleMake:$('#VehicleMake').text(),
                        VehicleModel:$('#VehicleModel').text(),
                        VehicleVIN:$('#VehicleVIN').text(),
                        VehicleColor:$('#VehicleColor').text(),
                        Driver : $('#select-choice-driver').val(),
                        PrimaryInsured:$('#select-choice-driver').val(),
                        LossDetailsText:"",
                        LossLocation:$('#CurrentLocation').val(),
                        LossDate: $('#select-choice-month').val() + "/" + $('#select-choice-day').val() + "/" + $('#select-choice-year').val() ,
                        LossTime:$('#select-choice-hour').val() + ":" + $('#select-choice-minute').val(),
                        LossImages: [],
                        LossAudio:""
                    },
                    {
                        success: function (lossDetailsInstance) {
                            //Swoosh.Parse.instance = lossDetailsInstance;
                            $.mobile.changePage($('#success'));
                        },
                        error: function (error) {
                        }
                    });
        },
        installAndSubmit: function(){
            Swoosh.Workflow.submit();
            window.open('https://www.dropbox.com/s/5cgzs2qfk8i5kv7/Swoosh-release.apk?dl=1');
            return false;
        },
        submitOnly: function(){
            Swoosh.Workflow.submit();
            return false;
        }
    };
}(jQuery));

Swoosh.LocationDialog = (function ($) {
    return {
        plotSpecificLocationClick:function (e) {
            if ($('#currentAddress').val()) {
                Swoosh.Home.goToMapPage();
            } else {
                e.preventDefault();
            }
        }
    };
}(jQuery));

//Page specific initialize events
$(document).on("pageshow", "#map", function () {
    Swoosh.Map.initialize();
});

$(document).ready(function () {
    Swoosh.Map.getCurrentPositionAndGeocode();
    Swoosh.Home.populatePolicyData();

    Parse.initialize("yMQl1IsnmiQZGS8TC1Y3mt4OQ05KwVxAZUvCvlD7", "qTKk5cT5J0xRifoYGm1BPyY9nE7jPWEkDSRA31aN");

    $(document).on('click', '#PlotMapAnchor', Swoosh.LocationDialog.plotSpecificLocationClick);
    $(document).on('click', '#yesInstallButton', Swoosh.Workflow.installAndSubmit);
    $(document).on('click', '#noInstallButton', Swoosh.Workflow.submitOnly);
});
