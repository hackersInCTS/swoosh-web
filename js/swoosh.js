var Swoosh = Swoosh || {};

Swoosh.Home = (function ($) {
    return{
        deviceReady:function () {

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

            var mapcanvas = document.createElement('div');
            mapcanvas.id = 'mapcanvas';
            mapcanvas.style.height = '400px';
            mapcanvas.style.width = '560px';

            document.querySelector('article').appendChild(mapcanvas);

            var latlng = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
            var myOptions = {
                zoom:15,
                center:latlng,
                mapTypeControl:false,
                navigationControlOptions:{style:google.maps.NavigationControlStyle.SMALL},
                mapTypeId:google.maps.MapTypeId.ROADMAP
            };
            var map = new google.maps.Map(document.getElementById("mapcanvas"), myOptions);

            var marker = new google.maps.Marker({
                position:latlng,
                map:map,
                title:"You are here! (at least within a " + position.coords.accuracy + " meter radius)"
            });
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
        notify: function(){
            return true;
        }
    };
}(jQuery));

$(document).ready(function () {

    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(Swoosh.Location.onLocationSuccess, Swoosh.Location.onLocationFailed);
    } else {
        Swoosh.Location.onLocationFailed('not supported');
    }

    $(document).on('deviceready', Swoosh.Home.deviceReady);

    $(document).on('click', '#NotifyButton', Swoosh.Workflow.notify);
});
