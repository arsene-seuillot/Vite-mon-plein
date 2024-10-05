var centre_lon= 2.7035; // Longitude du centre
var centre_lat= 48.4733; // Latitude du centre
var icone_centre;
var echelle = 12; // Zoom
var rayon_d_action = 5; // kilomètres autour du centre
var conso_defaut = 6;
var volume_defaut = 45;
var map ;
var Liste_Marqueurs = []
var Prix_pertes = []
var noms_stations = []




$( document ).ready(function() {
    
    // On récupère la géolocalisation pour le départ
    if (navigator.geolocation)
    navigator.geolocation.getCurrentPosition(function(position) {
        centre_lat = position.coords.latitude;
        centre_lon = position.coords.longitude;
        console.log(centre_lat,centre_lon)
    });
else {
    console.log("la géolocalisation n'est pas disponible");
        }
    
	// Affichage des coordonnées de départ
	$('#latitude').html( centre_lat );
	$('#longitude').html( centre_lon );
	$('#rayon_d_action').val( rayon_d_action );
	$('#consommation').val(conso_defaut);
	$('#volume').val(volume_defaut);
	
	// Géoportail
	map = L.map("Carte").setView([centre_lat, centre_lon], echelle) ;
	L.tileLayer(
		"https://wxs.ign.fr/cartes/geoportail/wmts?" +
		"SERVICE=WMTS&VERSION=1.0.0&REQUEST=GetTile" +
		"&STYLE=normal" +
		"&TILEMATRIXSET=PM" +
		"&FORMAT=image/png"+
		"&LAYER=GEOGRAPHICALGRIDSYSTEMS.PLANIGNV2"+
		"&TILEMATRIX={z}" +
		"&TILEROW={y}" +
		"&TILECOL={x}",
		{
			minZoom : 6,
			maxZoom : 20,
			attribution : "IGN-F/Geoportail",
			tileSize : 256 // les tuiles du Géooportail font 256x256px
		}
	).addTo(map);
	
	// Met une épingle au centre
	icone_centre = new L.marker(L.latLng(centre_lat, centre_lon)).addTo(map);
	// et cherche les stations
	chercher_stations();

	
	// En cas de clic sur la carte, récupérer les coordonnées
	map.on('click', function(e) {
		//console.log (e.latlng);
		centre_lat = e.latlng.lat;
		centre_lon = e.latlng.lng;
		// Affichage
		$('#latitude').html( centre_lat );
		$('#longitude').html( centre_lon );
		// Déplacer l'icône du centre
		icone_centre.setLatLng( L.latLng(centre_lat, centre_lon) );
		// et cherche les stations
		//chercher_stations();
    });
	
	// Clic sur Boutons
	$('#recalculer').click(function(){
		chercher_stations();
	})
	
	$('.calculer').click(function(){
	    var carburant = $(this).val();
	    chercher_stations(carburant);
	})
	
	
});

function chercher_stations(carburant){
    
    // On initialise en retirant tous les marqueurs
    //console.log(Liste_Marqueurs);
    for (var m in Liste_Marqueurs) {
        //console.log("hello");
        map.removeLayer(Liste_Marqueurs[m]);
    }
    Liste_Marqueurs = [];
    
    
	$('#texte').html('');
	rayon_d_action = parseInt($('#rayon_d_action').val()) * 1000; // m -> km
	// Chercher les Stations autour du centre
	var longitude = $('#longitude').html( );
	var latitude = $('#latitude').html( );
	var url = 'https://public.opendatasoft.com/api/records/1.0/search/?dataset=prix_des_carburants_j_7&q=&facet=cp&facet=pop&facet=city&facet=automate_24_24&facet=fuel&facet=shortage&facet=update&facet=services&facet=brand&geofilter.distance='
	url+= latitude +','+longitude +','+ rayon_d_action;
	console.log(  'relai.php?url=' +btoa(url) );

	$.ajax({
        url:  'relai.php?url=' +btoa(url),
        contentType: "application/json",
        dataType: 'json',
        success: function(result){
			var affichage ='';
			for (const num in result.records) {  // Pour chaque station
			
			    // on récupère les données (prix, ville, distance...)
			
				dist = parseInt( result.records[ num ].fields.dist ); // en mètres
				dist = parseInt( dist / 100) / 10 ; // en km et un chiffre après la virgule
  				prix = parseFloat(result.records[num].fields[carburant])*1000  // prix en €/L du carburant
  				prix = Math.round(prix*10000)/10000;
  				ville = result.records[num].fields.city;
  				nom = result.records[num].fields.name;
  				adresse = result.records[num].fields.address;
  				STATION = nom+" "+ ville;

                consommation = $('#consommation').val();
                volume = $('#volume').val();
                
                // On calcule le prix du trajet si il est fait à la pompe destination : 
                Conso_Km = consommation/100;
                Conso_trajet_L = consommation*dist
                prix_trajet = 2*Conso_trajet_L*prix   // x2 : aller retour
                prix_trajet = Math.round(prix_trajet*100)/10000;  //erreur à corriger sur le prix du trajet
                
                // On calcule le prix du plein pour ce carburant :
                prix_plein = prix*volume
                prix_plein = Math.round(prix_plein*100)/100;

				
				// Si ce carburant est proposé
  				if (isNaN(prix) == false) {
                    affichage += '• '+ "<span class='ville'>"+ville+"</span>"+" : "+ dist + " km " +'<br>'
                    + "<span class='infos_fixes'>Prix du carburant : </span>" + prix + "€/L"+'<br>'
                    + "<span class='infos_fixes'>Prix du plein : </span>"+prix_plein+" €"+'<br>'
                    + "<span class='infos_fixes'>Prix du trajet : </span>"+prix_trajet+" €"+'<br>'
                    + "<span class='infos_fixes'>Station Service : </span>" + "<span class='adresse'>"+nom+"</span>"+"<br>"
                    + "<span class='infos_fixes'>Adresse : </span>"+ "<span class='adresse'>"+adresse+"</span>"+ '<br><br>';
                    var ref = new L.marker(result.records[ num ].fields.geo_point);
				    Liste_Marqueurs.push(ref); // on rajoute la réf du marqueur à la liste des marqueurs à afficher
                }
				
			}
			
			console.log(noms_stations);
			console.log(Prix_pertes);
			
			// Ajouter les marqueurs : on ajoutera celui de l'indice de la station cherchée d'une autre couleur par exemple
			for (m in Liste_Marqueurs) {
			    Liste_Marqueurs[m].addTo(map);
			}
			
			if( affichage=='') affichage="<span class='echec'>aucun résultat</span>";
			//console.log( 'Résultat', result.records );
			// Ajouter l'URL utilisée
			//html+='<hr>URL utilisée :<br><a href="'+url+'">'+url.replaceAll('&', '<br>&')+'</a>';
            $('#texte').html(affichage);
            
            
                
            }
            
        }
    )
}




