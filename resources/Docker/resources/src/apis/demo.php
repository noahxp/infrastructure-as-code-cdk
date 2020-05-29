<?php
header("Content-Type: application/json;charset=utf-8");

$ret = array("now" => date("Y-m-d h:i:s"));
echo json_encode($ret);

exit();
?>
