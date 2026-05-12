// Payment form submission
document.getElementById('paymentForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const bookingRef = document.getElementById('bookingRef').value.trim();
  const paymentMethod = document.getElementById('paymentMethod').value;
  const cardNo = document.getElementById('cardNo').value.trim();
  const accountNo = document.getElementById('accountNo').value.trim();
  
  if (!bookingRef || !paymentMethod) {
    showPaymentMessage('Please fill all required fields', 'error');
    return;
  }
  
  if (paymentMethod === 'CARD' && !cardNo && !accountNo) {
    showPaymentMessage('Please enter card number or account number for card payment', 'error');
    return;
  }
  
  const payload = {
    booking_ref: bookingRef,
    payment_method: paymentMethod
  };
  
  if (cardNo) payload.card_no = cardNo;
  if (accountNo) payload.account_no = accountNo;
  
  try {
    const response = await fetch('../../backend/payments/process.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    
    const data = await response.json();
    
    if (data.status === 'success') {
      showPaymentMessage(
        `✓ Payment Processed Successfully!\n\nBooking: ${data.booking_ref}\nAmount: $${data.amount}\nStatus: ${data.booking_status}`,
        'success'
      );
      
      // Clear form
      document.getElementById('paymentForm').reset();
      document.getElementById('cardPaymentFields').style.display = 'none';
      
      // Refresh booking list after 2 seconds
      setTimeout(() => {
        location.reload();
      }, 2000);
    } else {
      showPaymentMessage('✗ ' + data.message, 'error');
    }
  } catch (error) {
    console.error('Payment error:', error);
    showPaymentMessage('Server error: ' + error.message, 'error');
  }
});

// Refund form submission
document.getElementById('refundForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const bookingRef = document.getElementById('refundBookingRef').value.trim();
  const refundType = document.getElementById('refundType').value;
  
  if (!bookingRef || !refundType) {
    showRefundMessage('Please fill all required fields', 'error');
    return;
  }
  
  if (!confirm('Are you sure you want to process this refund?')) {
    return;
  }
  
  try {
    const response = await fetch('../../backend/payments/refund.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        booking_ref: bookingRef,
        refund_type: refundType
      })
    });
    
    const data = await response.json();
    
    if (data.status === 'success') {
      showRefundMessage(
        `✓ Refund Processed Successfully!\n\nBooking: ${data.booking_ref}\nAmount: $${data.amount}\nRefund Type: ${data.refund_type}\nStatus: ${data.booking_status}`,
        'success'
      );
      
      // Clear form
      document.getElementById('refundForm').reset();
      
      // Refresh page after 2 seconds
      setTimeout(() => {
        location.reload();
      }, 2000);
    } else {
      showRefundMessage('✗ ' + data.message, 'error');
    }
  } catch (error) {
    console.error('Refund error:', error);
    showRefundMessage('Server error: ' + error.message, 'error');
  }
});

function showPaymentMessage(message, type) {
  const messageBox = document.getElementById('paymentMessage');
  messageBox.textContent = message;
  messageBox.className = 'message-box ' + (type === 'success' ? 'success' : 'error');
  messageBox.style.display = 'block';
  
  if (type === 'error') {
    setTimeout(() => {
      messageBox.style.display = 'none';
    }, 5000);
  }
}

function showRefundMessage(message, type) {
  const messageBox = document.getElementById('refundMessage');
  messageBox.textContent = message;
  messageBox.className = 'message-box ' + (type === 'success' ? 'success' : 'error');
  messageBox.style.display = 'block';
  
  if (type === 'error') {
    setTimeout(() => {
      messageBox.style.display = 'none';
    }, 5000);
  }
}
