/**
 * Constants for business rules
 */
const START_HOUR = 9; // 9:00 AM
const END_HOUR = 21;  // 9:00 PM (21:00)
const PREP_TIME_HOURS = 5; // 5 hours buffer

/**
 * Hàm tính toán ngày/giờ giao hàng sớm nhất (cho DatePicker & Validation)
 */
export function getEarliestDeliveryDate() {
    const now = new Date();
    const currentHour = now.getHours();
    
    let targetTime = new Date(now);

    // LOGIC MỚI:
    // 1. Nếu đặt trước 9h sáng -> Giao từ 14h chiều nay (9h + 5 tiếng)
    if (currentHour < START_HOUR) {
        targetTime.setHours(START_HOUR + PREP_TIME_HOURS, 0, 0, 0); // 14:00
    }
    // 2. Nếu đặt sau 16h (4h chiều) -> Giao từ 9h sáng mai
    else if (currentHour >= 16) {
        targetTime.setDate(targetTime.getDate() + 1); // Ngày mai
        targetTime.setHours(START_HOUR, 0, 0, 0);     // 09:00 Sáng
    }
    // 3. Nếu đặt trong giờ làm việc (9h - 16h) -> Giao sau 5 tiếng
    else {
        targetTime.setHours(currentHour + PREP_TIME_HOURS, 0, 0, 0);
    }

    return targetTime;
}

/**
 * Hàm hiển thị thông báo gợi ý (cho giao diện)
 */
export function calculateDeliveryEstimate() {
    const earliestDate = getEarliestDeliveryDate();
    const now = new Date();

    let message = "";
    
    // Kiểm tra xem có phải là ngày mai không
    const isTomorrow = earliestDate.getDate() !== now.getDate();

    const timeString = earliestDate.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit' 
    });

    if (isTomorrow) {
        // Nếu là ngày mai -> "Tomorrow by 09:00 AM"
        message = `Tomorrow by ${timeString}`;
    } else {
        // Nếu là hôm nay -> "Today by 02:00 PM" hoặc "Today by 05:00 PM"
        message = `Today by ${timeString}`;
    }

    return {
        dateObj: earliestDate,
        displayMessage: message
    };
}

/**
 * Validate giờ khách chọn trong form "Schedule"
 */
export function validateSelectedTime(dateStr, timeStr) {
    if (!dateStr || !timeStr) {
        return { isValid: false, message: "Please select both date and time." };
    }

    const selectedDate = new Date(`${dateStr}T${timeStr}`);
    const earliestDate = getEarliestDeliveryDate();
    
    // 1. Không được chọn giờ quá khứ so với giờ giao sớm nhất
    if (selectedDate < earliestDate) {
        return { 
            isValid: false, 
            message: "Selected time is too soon. Please choose a later time." 
        };
    }

    // 2. Chỉ được giao trong khung giờ làm việc (9h - 21h)
    const selectedHour = selectedDate.getHours();
    if (selectedHour < START_HOUR || selectedHour >= END_HOUR) {
        return { 
            isValid: false, 
            message: `Delivery is only available between ${START_HOUR}:00 and ${END_HOUR}:00.` 
        };
    }

    return { isValid: true, message: "" };
}

/**
 * Format ngày để hiển thị đẹp
 */
export function formatDeliveryDisplay(dateObj) {
    return dateObj.toLocaleString('en-US', { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit' 
    });
}