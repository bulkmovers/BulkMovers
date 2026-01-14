// Grab the service toggle inputs and both forms
const serviceRadios = document.querySelectorAll('input[name="service"]');
const junkForm = document.getElementById('junkForm');
const deliveryForm = document.getElementById('deliveryForm');
const toggle = document.querySelector('.toggle');
const submitButtons = document.querySelectorAll('.submit-btn');
const successModal = document.getElementById('successModal');
const modalButtons = document.querySelectorAll('.modal-btn');
const emailClient = window.emailjs;
const EMAIL_SERVICE_ID = 'service_b7jknvf';
const EMAIL_TEMPLATE_ID = 'template_i8ta6bx';
const EMAIL_PUBLIC_KEY = 'D6fTxTt6Bw_v1kEXU';

// Mobile menu elements
const menuToggle = document.querySelector('.menu-toggle');
const menuPanel = document.querySelector('.menu-panel');

const isValidEmail = value => /^\S+@\S+\.\S+$/.test(value);
const isValidPhone = value => value.replace(/\D/g, '').length >= 7;

const setError = (element, message) => {
    if (!element) {
        return;
    }
    let error = element.parentElement.querySelector('.error-text');
    if (!message) {
        if (error) {
            error.remove();
        }
        return;
    }
    if (!error) {
        error = document.createElement('div');
        error.className = 'error-text';
        element.parentElement.appendChild(error);
    }
    error.textContent = message;
};

const markInvalid = (element, isInvalid) => {
    if (!element) {
        return;
    }
    element.classList.toggle('invalid', Boolean(isInvalid));
    if (!isInvalid) {
        setError(element, '');
    }
};

const validateRequired = (element, message) => {
    const isInvalid = !element || element.value.trim() === '';
    markInvalid(element, isInvalid);
    if (isInvalid) {
        setError(element, message);
    }
    return !isInvalid;
};

const validateFile = (element, message) => {
    const isInvalid = !element || !element.files || element.files.length === 0;
    markInvalid(element, isInvalid);
    if (isInvalid) {
        setError(element, message);
    }
    return !isInvalid;
};

const validateContact = (phoneInput, emailInput) => {
    const phoneValue = phoneInput.value.trim();
    const emailValue = emailInput.value.trim();

    if (phoneValue === '' && emailValue === '') {
        markInvalid(phoneInput, true);
        markInvalid(emailInput, true);
        setError(phoneInput, 'Phone or email required.');
        setError(emailInput, 'Phone or email required.');
        return false;
    }

    const phoneOk = phoneValue === '' || isValidPhone(phoneValue);
    const emailOk = emailValue === '' || isValidEmail(emailValue);

    markInvalid(phoneInput, !phoneOk);
    markInvalid(emailInput, !emailOk);
    if (!phoneOk && phoneValue !== '') {
        setError(phoneInput, 'Enter a valid phone number.');
    }
    if (!emailOk && emailValue !== '') {
        setError(emailInput, 'Enter a valid email address.');
    }

    return phoneOk && emailOk;
};

const getValue = element => (element ? element.value.trim() : '');
const getFileName = element => {
    if (!element || !element.files || element.files.length === 0) {
        return '';
    }
    return element.files[0].name;
};

const buildEmailParams = formType => {
    const phone = formType === 'junk'
        ? getValue(document.getElementById('junkPhone'))
        : getValue(document.getElementById('deliveryPhone'));
    const email = formType === 'junk'
        ? getValue(document.getElementById('junkEmail'))
        : getValue(document.getElementById('deliveryEmail'));

    return {
        service_type: formType === 'junk' ? 'Junk Removal' : 'Delivery',
        pickup_address: getValue(document.getElementById('junkPickupAddress')) || 'N/A',
        junk_type: getValue(document.getElementById('junkType')) || 'N/A',
        estimated_volume: getValue(document.getElementById('junkVolume')) || 'N/A',
        preferred_date: getValue(document.getElementById('junkDate')) || 'N/A',
        preferred_time: getValue(document.getElementById('junkTimeWindow')) || 'N/A',
        additional_notes: getValue(document.getElementById('junkNotes')) || 'N/A',
        junk_photo_link: getFileName(document.getElementById('junkPhoto')) || 'N/A',
        delivery_pickup: getValue(document.getElementById('deliveryPickup')) || 'N/A',
        delivery_dropoff: getValue(document.getElementById('deliveryDropoff')) || 'N/A',
        item_description: getValue(document.getElementById('deliveryDescription')) || 'N/A',
        delivery_date: getValue(document.getElementById('deliveryDate')) || 'N/A',
        delivery_time: getValue(document.getElementById('deliveryTimeWindow')) || 'N/A',
        item_link: getValue(document.getElementById('deliveryItemLink')) || 'N/A',
        delivery_photo_link: getFileName(document.getElementById('deliveryPhoto')) || 'N/A',
        phone: phone || 'N/A',
        email: email || 'N/A',
        preferred_contact: formType === 'junk'
            ? getValue(document.getElementById('junkContact')) || 'N/A'
            : getValue(document.getElementById('deliveryContact')) || 'N/A',
        name_or_contact: phone || email || 'N/A'
    };
};

const sendEmail = async (params, button) => {
    if (!emailClient) {
        window.alert('Email service not available. Please try again later.');
        return false;
    }

    button.disabled = true;
    try {
        await emailClient.send(EMAIL_SERVICE_ID, EMAIL_TEMPLATE_ID, params, {
            publicKey: EMAIL_PUBLIC_KEY
        });
        return true;
    } catch (error) {
        console.error('EmailJS error:', error);
        window.alert('There was a problem sending your request. Please try again.');
        return false;
    } finally {
        button.disabled = false;
    }
};

if (emailClient) {
    emailClient.init({
        publicKey: EMAIL_PUBLIC_KEY
    });
}

if (junkForm && deliveryForm && toggle) {
    serviceRadios.forEach(radio => {
        radio.addEventListener('change', () => {
            // Show the selected form and hide the other
            if (radio.value === 'junk') {
                junkForm.classList.add('active');
                deliveryForm.classList.remove('active');
                toggle.dataset.active = 'junk';
            } else {
                deliveryForm.classList.add('active');
                junkForm.classList.remove('active');
                toggle.dataset.active = 'delivery';
            }
        });
    });
}

submitButtons.forEach(button => {
    button.addEventListener('click', async () => {
        const formType = button.dataset.form;
        let isValid = true;

        if (formType === 'junk') {
            isValid = validateRequired(document.getElementById('junkPickupAddress'), 'Pickup address is required.') && isValid;
            isValid = validateRequired(document.getElementById('junkDate'), 'Select a service date.') && isValid;
            isValid = validateRequired(document.getElementById('junkTimeWindow'), 'Select a time window.') && isValid;
            isValid = validateFile(document.getElementById('junkPhoto'), 'Please upload a photo.') && isValid;
            isValid = validateContact(
                document.getElementById('junkPhone'),
                document.getElementById('junkEmail')
            ) && isValid;
            isValid = validateRequired(document.getElementById('junkContact'), 'Select a contact method.') && isValid;
        }

        if (formType === 'delivery') {
            isValid = validateRequired(document.getElementById('deliveryPickup'), 'Pickup location is required.') && isValid;
            isValid = validateRequired(document.getElementById('deliveryDropoff'), 'Drop-off location is required.') && isValid;
            isValid = validateRequired(document.getElementById('deliveryDate'), 'Select a service date.') && isValid;
            isValid = validateRequired(document.getElementById('deliveryTimeWindow'), 'Select a time window.') && isValid;
            isValid = validateFile(document.getElementById('deliveryPhoto'), 'Please upload a photo.') && isValid;
            isValid = validateContact(
                document.getElementById('deliveryPhone'),
                document.getElementById('deliveryEmail')
            ) && isValid;
            isValid = validateRequired(document.getElementById('deliveryContact'), 'Select a contact method.') && isValid;
        }

        if (isValid) {
            const sent = await sendEmail(buildEmailParams(formType), button);
            if (sent && successModal) {
                successModal.classList.add('open');
                successModal.setAttribute('aria-hidden', 'false');
            }
        }
    });
});

document.querySelectorAll('input, select, textarea').forEach(field => {
    field.addEventListener('input', () => markInvalid(field, false));
    field.addEventListener('change', () => markInvalid(field, false));
});

if (menuToggle && menuPanel) {
    menuToggle.addEventListener('click', () => {
        const isOpen = menuPanel.classList.toggle('open');
        menuToggle.classList.toggle('open', isOpen);
        menuToggle.setAttribute('aria-expanded', String(isOpen));
        menuToggle.setAttribute('aria-label', isOpen ? 'Close menu' : 'Open menu');
        menuToggle.textContent = isOpen ? '–' : '☰';
    });

    menuPanel.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            menuPanel.classList.remove('open');
            menuToggle.classList.remove('open');
            menuToggle.setAttribute('aria-expanded', 'false');
            menuToggle.setAttribute('aria-label', 'Open menu');
            menuToggle.textContent = '☰';
        });
    });

    document.addEventListener('click', event => {
        if (!menuPanel.classList.contains('open')) {
            return;
        }

        const isClickInside = menuPanel.contains(event.target) || menuToggle.contains(event.target);
        if (!isClickInside) {
            menuPanel.classList.remove('open');
            menuToggle.classList.remove('open');
            menuToggle.setAttribute('aria-expanded', 'false');
            menuToggle.setAttribute('aria-label', 'Open menu');
            menuToggle.textContent = '☰';
        }
    });
}

if (successModal) {
    successModal.addEventListener('click', event => {
        if (event.target === successModal) {
            successModal.classList.remove('open');
            successModal.setAttribute('aria-hidden', 'true');
        }
    });
}

modalButtons.forEach(button => {
    button.addEventListener('click', () => {
        const action = button.dataset.action;
        if (action === 'another') {
            if (junkForm && junkForm.classList.contains('active')) {
                junkForm.reset();
            }
            if (deliveryForm && deliveryForm.classList.contains('active')) {
                deliveryForm.reset();
            }
        }
        if (successModal) {
            successModal.classList.remove('open');
            successModal.setAttribute('aria-hidden', 'true');
        }
    });
});
