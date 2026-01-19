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

const validateFiles = (element, message, maxFiles = 4) => {
    const fileCount = element && element.files ? element.files.length : 0;
    const tooMany = fileCount > maxFiles;
    const isInvalid = fileCount === 0 || tooMany;
    markInvalid(element, isInvalid);
    if (isInvalid) {
        setError(element, tooMany ? `Upload up to ${maxFiles} photos.` : message);
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

const setFormMeta = (formType, form) => {
    if (!form) {
        return;
    }
    const phone = getValue(form.querySelector('[name="phone"]'));
    const email = getValue(form.querySelector('[name="email"]'));
    const nameOrContact = phone || email || 'N/A';
    const serviceType = formType === 'junk' ? 'Junk Removal' : 'Delivery';
    const serviceInput = form.querySelector('input[name="service_type"]');
    const contactInput = form.querySelector('input[name="name_or_contact"]');

    if (serviceInput) {
        serviceInput.value = serviceType;
    }
    if (contactInput) {
        contactInput.value = nameOrContact;
    }
};

const sendEmail = async (form, button) => {
    if (!emailClient) {
        window.alert('Email service not available. Please try again later.');
        return false;
    }

    button.disabled = true;
    try {
        await emailClient.sendForm(EMAIL_SERVICE_ID, EMAIL_TEMPLATE_ID, form, {
            publicKey: EMAIL_PUBLIC_KEY
        });
        return true;
    } catch (error) {
        const errorText = error && (error.text || error.message) ? `${error.text || error.message}` : 'Unknown error';
        console.error('EmailJS error:', error);
        window.alert(`There was a problem sending your request: ${errorText}`);
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
        const form = formType === 'junk' ? junkForm : deliveryForm;
        let isValid = true;

        if (formType === 'junk') {
            isValid = validateRequired(document.getElementById('junkPickupAddress'), 'Pickup address is required.') && isValid;
            isValid = validateRequired(document.getElementById('junkDate'), 'Select a service date.') && isValid;
            isValid = validateRequired(document.getElementById('junkTimeWindow'), 'Select a time window.') && isValid;
            isValid = validateFiles(
                document.getElementById('junkPhoto'),
                'Please upload at least one photo.',
                4
            ) && isValid;
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
            isValid = validateFiles(
                document.getElementById('deliveryPhoto'),
                'Please upload at least one photo.',
                4
            ) && isValid;
            isValid = validateContact(
                document.getElementById('deliveryPhone'),
                document.getElementById('deliveryEmail')
            ) && isValid;
            isValid = validateRequired(document.getElementById('deliveryContact'), 'Select a contact method.') && isValid;
        }

        if (isValid) {
            setFormMeta(formType, form);
            const sent = await sendEmail(form, button);
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
