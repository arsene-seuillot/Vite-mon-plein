<?php

$debug=false;

// Affiche l'URL demandée
$url= base64_decode( $_GET['url']);

if( $debug ){
	$f='donnees_test.json';
	if( is_file( $f )){
		echo file_get_contents( $f );
	} else {
		$txt = `wget -O - '$url'` ;
		file_put_contents($f, $txt );
		echo file_get_contents( $f );
	}
	
} else {
	// echo `wget -O - '$url'` ;

    $arrContextOptions=array(
        "ssl"=>array(
            "verify_peer"=>false,
            "verify_peer_name"=>false,
        ),
    );
	echo file_get_contents( $url, false, stream_context_create($arrContextOptions) );
}





