<?php
include 'config.php';

// Get the POST data
$symptom = $_POST["symptom"];
$detected_At = $_POST["detected_At"];

// Generate the next record ID
function generateNextRecordId($conn) {
    // Get the highest existing record_id
    $result = $conn->query("SELECT MAX(record_id) as max_id FROM heath_record");
    $row = $result->fetch_assoc();
    $maxId = $row['max_id'];
    
    if ($maxId) {
        // Extract the numeric part and increment
        $num = (int)substr($maxId, 1);
        $nextNum = $num + 1;
    } else {
        // First record
        $nextNum = 0;
    }
    
    // Format as r000 to r999
    if ($nextNum > 999) {
        die("Maximum record limit reached (999 records)");
    }
    
    return 'r' . str_pad($nextNum, 3, '0', STR_PAD_LEFT);
}

$record_id = generateNextRecordId($conn);

// Prepare and execute the SQL statement
$sql = "INSERT INTO heath_record (record_id, symptom, detected_At) VALUES (?, ?, ?)";
$stmt = $conn->prepare($sql);
$stmt->bind_param("sss", $record_id, $symptom, $detected_At);

if ($stmt->execute()) {
    echo "New health record added successfully with ID: $record_id";
} else {
    echo "Error: " . $sql . "<br>" . $conn->error;
}

$stmt->close();
$conn->close();
?>