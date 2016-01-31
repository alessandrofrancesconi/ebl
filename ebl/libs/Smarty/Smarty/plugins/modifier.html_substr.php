<?php 
/* 
 * Smarty plugin 
 ----------------------------------------------------- 
 * File: modifier.html_substr.php 
 * Type: modifier 
 * Name: html_substr 
 * Version: 1.0 
 * Date: September 21th, 2015
 * Purpose: Cut a string preserving any tag nesting and matching. 
 * Install: Drop into the plugin directory. 
 * Author: Originally from http://www.smarty.net/forums/viewtopic.php?t=533, adapted for Ebl by Alessandro Francesconi 
 * Example Usage {$htmlString|html_substr:<lengh>:<string_to_add>} 
 ------------------------------------------------------------- 
 */ 
 function smarty_modifier_html_substr($string, $length, $unit, $end) { 
     
     if ($unit == "par")
     {
         $cutAt = strposX($string, "</p>", intval($length));
         $ret = substr($string, 0, $cutAt);
         $ret .= $end;
         return $ret;
     }
     
     // only execute if text is longer than desired length 
     if (strlen($string) > $length) { 
         if( !empty( $string ) && $length > 0 ) { 
             $isText = true; 
             $ret = ""; 
             $i = 0; 

             $lastSpacePosition = -1; 

             $tagsArray = array(); 
             $currentTag = ""; 

             $noTagLength = strlen(strip_tags($string)); 

             // Parser loop 
             $string_length = strlen($string); 
             for($j = 0 ; $j < $string_length ; $j++) { 

                 $currentChar = substr( $string, $j, 1 ); 
                 $ret .= $currentChar; 

                 // Lesser than event 
                 if( $currentChar == "<") $isText = false; 

                 // Character handler 
                 if( $isText ) { 

                     // Memorize last space position 
                     if( $currentChar == " " ) { 
                         $lastSpacePosition = $j; 
                     } 
                     else { 
                         $lastChar = $currentChar; 
                     } 

                     $i++; 
                 } else { 
                     $currentTag .= $currentChar; 
                 } 

                 // Greater than event 
                 if( $currentChar == ">" ) { 
                     $isText = true; 

                     // Opening tag handler 
                     if( ( strpos( $currentTag, "<" ) !== false) && 
                             ( strpos( $currentTag, "/>" ) === false) && 
                             ( strpos( $currentTag, "</") === false) ) { 

                         // Tag has attribute(s) 
                         if( strpos( $currentTag, " " ) !== false ) { 
                             $currentTag = substr( $currentTag, 1, strpos( $currentTag, " " ) - 1 ); 
                         } else { 
                             // Tag doesn't have attribute(s) 
                             $currentTag = substr( $currentTag, 1, -1 ); 
                         } 

                         array_push( $tagsArray, $currentTag ); 

                     } else if( strpos( $currentTag, "</" ) !== false ) { 
                         array_pop( $tagsArray ); 
                     } 

                     $currentTag = ""; 
                 } 

                 if( $i >= $length) { 
                     break; 
                 } 
             } 

             // Cut HTML string at last space position 
             if( $length < $noTagLength ) { 
                 if( $lastSpacePosition != -1 ) { 
                     $ret = substr( $string, 0, $lastSpacePosition ); 
                 } else { 
                     $ret = substr( $string, $j ); 
                 } 
             } 

             // Close broken XHTML elements 
             while( count( $tagsArray ) != 0 ) { 
                 if ( count( $tagsArray ) > 1 ) { 
                     $aTag = array_pop( $tagsArray ); 
                     $ret .= "</" . $aTag . ">\n"; 
                 } 
                 // You may add more tags here to put the link and added text before the closing tag 
                 elseif ($aTag = 'p' || 'div') { 
                     $aTag = array_pop( $tagsArray ); 
                     $ret .= $end . "\n"; 
                 } 
                 else { 
                     $aTag = array_pop( $tagsArray ); 
                     $ret .= "</" . $aTag . ">" . $end ."\n"; 
                 } 
             } 
         } else { 
             $ret = ""; 
         } 

         return $ret; 
     } 
     else { 
         return $string; 
     }
     
 }
 
function strposX($haystack, $needle, $number)
{
    if ($number == 1)
    {
        return strpos($haystack, $needle);
    } 
    else if ($number > 1)
    {
        return strpos($haystack, $needle, strposX($haystack, $needle, $number - 1) + strlen($needle));
    }
}