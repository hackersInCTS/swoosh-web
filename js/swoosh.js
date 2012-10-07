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
            $(items).each(function (index, value) {
                    if (value === selectedValue) {
                        dropdown.append($("<option />").val(value).text(value)).attr('selected', true);
                    }
                    else {
                        dropdown.append($("<option />").val(value).text(value));
                    }
                }
            );
        }
    };
}(jQuery));

Swoosh.Home = (function ($) {
    return{
        deviceReady:function () {

        },
        populatePolicyData:function () {
            var policyData = $.parseJSON(Swoosh.Common.getQueryStringValue('policyJson'));
            $('#PolicyKey').text(policyData.PolicyKey);
            $('#VehicleMake').text(policyData.VehicleMake);
            $('#VehicleModel').text(policyData.VehicleModel);
            $('#VehicleVIN').text(policyData.VehicleVIN);
            $('#VehicleColor').text(policyData.VehicleColor);

            Swoosh.Common.populateDropDown('#select-choice-driver', policyData.Driver, policyData.PrimaryInsured);
            //$('#select-choice-driver option:eq(' + policyData.PrimaryInsured + ')').prop('selected', true);
            //$('#select-choice-driver').val(policyData.PrimaryInsured);

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
//                    Swoosh.Map.plotMap(mapViewModel);
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

Swoosh.Location = (function ($) {
    return {
        onLocationSuccess:function (position) {
            var s = document.querySelector('#status');

            if (s.className == 'success') {
                // not sure why we're hitting this twice in FF, I think it's to do with a cached result coming back
                return;
            }

            s.innerHTML = "found you!";
            s.className = 'success';

//            var mapcanvas = document.createElement('div');
//            mapcanvas.id = 'mapcanvas';
//            mapcanvas.style.height = '400px';
//            mapcanvas.style.width = '560px';

//            document.querySelector('article').appendChild(mapcanvas);

            var latlng = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
//            var myOptions = {
//                zoom:15,
//                center:latlng,
//                mapTypeControl:false,
//                navigationControlOptions:{style:google.maps.NavigationControlStyle.SMALL},
//                mapTypeId:google.maps.MapTypeId.ROADMAP
//            };
//            var map = new google.maps.Map(document.getElementById("mapcanvas"), myOptions);
//
//            var marker = new google.maps.Marker({
//                position:latlng,
//                map:map,
//                title:"You are here! (at least within a " + position.coords.accuracy + " meter radius)"
//            });
        },
        onLocationFailed:function (msg) {
            var s = document.querySelector('#status');
            s.innerHTML = typeof msg == 'string' ? msg : "failed";
            s.className = 'fail';
        }
    };
}(jQuery));

Swoosh.Workflow = (function ($) {
    return {
        submit:function () {
//          TODO: Build json and pass it to Parse backend
//            {
//                "PolicyKey": "123456ABC",
//                "VehicleMake":"JEEP",
//                "VehicleModel":"Liberty",
//                "VehicleVIN":"12DED121212121212",
//                "VehicleColor":"Green",
//                "Driver" : "Vikram",
//                "PrimaryInsured":"Vikram",
//                "LossDetailsText":"i was backing up and hit a tree",
//                "LossLocation":"1.213213123,5.323213213",
//                "LossDate":"9/1/2012",
//                "LossTime":"13:43",
//                "LossImages": [{"Key":"kjhdsaflkhj7868900909009839831098","Type":"License
//
//                Plate"},{"Key":"kjhdsaflkhj7868900909009839831098","Type":"License Plate"}],
//                    "LossAudio":"lkhlkjjjjjjjjlkkkkkkkkkkkkkkkkkkkk"
//            }

        },
        notify:function () {
            return true;
        },
        confirm:function () {

            Swoosh.Workflow.submit();

            var elem = $(this).closest('.item');

            $.confirm({
                'title':'Delete Confirmation',
                'message':'Do you wish to install our mobile app after submitting your report?',
                'buttons':{
                    'Yes':{
                        'class':'blue',
                        'action':function () {
                            //elem.slideUp();
                            $.get('https://github.com/FloydPink-Public/spinach-android/raw/master/bin/Swoosh-release.apk', function (data) {
                                $(this).simpledialog2({
                                    'mode':'blank',
                                    'prompt':false,
                                    'forceInput':false,
                                    'useModal':true,
                                    'fullHTML':data
                                });
                            });
                        }
                    },
                    'No':{
                        'class':'gray',
                        'action':function () {
                        }
                    }
                }
            });

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

//    if (navigator.geolocation) {
//        navigator.geolocation.getCurrentPosition(Swoosh.Location.onLocationSuccess, Swoosh.Location.onLocationFailed);
//    } else {
//        Swoosh.Location.onLocationFailed('not supported');
//    }

    Swoosh.Map.getCurrentPositionAndGeocode();
    Swoosh.Home.populatePolicyData();

    //Parse.initialize("yMQl1IsnmiQZGS8TC1Y3mt4OQ05KwVxAZUvCvlD7", "qTKk5cT5J0xRifoYGm1BPyY9nE7jPWEkDSRA31aN");

    $(document).on('click', '#NotifyButton', Swoosh.Workflow.notify);
    $(document).on('click', '#ConfirmButton', Swoosh.Workflow.confirm);
    $(document).on('click', '#PlotMapAnchor', Swoosh.LocationDialog.plotSpecificLocationClick);
});
