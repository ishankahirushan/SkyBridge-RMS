<?php

function parse_seat_summary(?string $seatSummary): array
{
    if (empty($seatSummary)) {
        return [];
    }

    $seatCategories = [];
    $segments = explode(';;', $seatSummary);

    foreach ($segments as $segment) {
        [$category, $availableSeats, $totalSeats, $priceMultiplier] = explode('|', $segment);
        $seatCategories[] = [
            'seat_category' => $category,
            'available_seats' => (int) $availableSeats,
            'total_seats' => (int) $totalSeats,
            'price_multiplier' => (float) $priceMultiplier,
            'status' => (int) $availableSeats > 0 ? 'AVAILABLE' : 'FULL',
        ];
    }

    return $seatCategories;
}
