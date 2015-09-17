<?php

function generateRandomString ($length){
    $randString = "";
    $availableChars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    for($i = 0; $i < $length; $i++) {
        $r = rand(0, strlen($availableChars) - 1);
        $randChar = $availableChars[$r];
        $randString .= $randChar;
    }
    
    return $randString;
}

?>