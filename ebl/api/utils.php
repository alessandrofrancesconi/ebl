<?php

function generateRandomString ($count){
    $randString = "";
    $availableChars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    for($i=0; $i < $count; $i++) {
        $r = rand(0, strlen($availableChars) - 1);
        $randChar = $availableChars[$r];
        $randString .= $randChar;
    }
    
    return $randString;
}

?>