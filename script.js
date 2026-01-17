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

const fileToDataUrl = file => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Failed to read file.'));
    reader.readAsDataURL(file);
});

const compressImage = async (file, maxDimension = 1280, quality = 0.75) => {
    if (!file || !file.type.startsWith('image/')) {
        return fileToDataUrl(file);
    }
    const dataUrl = await fileToDataUrl(file);
    return new Promise((resolve, reject) => {
        const image = new Image();
        image.onload = () => {
            const largestSide = Math.max(image.width, image.height);
            const scale = largestSide > maxDimension ? maxDimension / largestSide : 1;
            const width = Math.round(image.width * scale);
            const height = Math.round(image.height * scale);
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const context = canvas.getContext('2d');
            if (!context) {
                reject(new Error('Canvas not supported.'));
                return;
            }
            context.drawImage(image, 0, 0, width, height);
            resolve(canvas.toDataURL('image/jpeg', quality));
        };
        image.onerror = () => reject(new Error('Failed to load image.'));
        image.src = dataUrl;
    });
};

const getPhotoData = async (element, maxFiles = 4) => {
    const files = element && element.files ? Array.from(element.files).slice(0, maxFiles) : [];
    const dataUrls = await Promise.all(files.map(file => compressImage(file)));
    const names = files.map(file => file.name);
    return { dataUrls, names };
};

const buildEmailParams = (formType, photos) => {
    const phone = formType === 'junk'
        ? getValue(document.getElementById('junkPhone'))
        : getValue(document.getElementById('deliveryPhone'));
    const email = formType === 'junk'
        ? getValue(document.getElementById('junkEmail'))
        : getValue(document.getElementById('deliveryEmail'));
    const customerName = formType === 'junk'
        ? getValue(document.getElementById('junkName'))
        : getValue(document.getElementById('deliveryName'));

    const photoData = photos && photos.dataUrls ? photos.dataUrls : [];
    const photoNames = photos && photos.names ? photos.names : [];

    return {
        service_type: formType === 'junk' ? 'Junk Removal' : 'Delivery',
        customer_name: customerName || 'N/A',
        pickup_address: getValue(document.getElementById('junkPickupAddress')) || 'N/A',
        junk_type: getValue(document.getElementById('junkType')) || 'N/A',
        estimated_volume: getValue(document.getElementById('junkVolume')) || 'N/A',
        preferred_date: getValue(document.getElementById('junkDate')) || 'N/A',
        preferred_time: getValue(document.getElementById('junkTimeWindow')) || 'N/A',
        additional_notes: getValue(document.getElementById('junkNotes')) || 'N/A',
        delivery_pickup: getValue(document.getElementById('deliveryPickup')) || 'N/A',
        delivery_dropoff: getValue(document.getElementById('deliveryDropoff')) || 'N/A',
        item_description: getValue(document.getElementById('deliveryDescription')) || 'N/A',
        delivery_date: getValue(document.getElementById('deliveryDate')) || 'N/A',
        delivery_time: getValue(document.getElementById('deliveryTimeWindow')) || 'N/A',
        item_link: getValue(document.getElementById('deliveryItemLink')) || 'N/A',
        phone: phone || 'N/A',
        email: email || 'N/A',
        preferred_contact: formType === 'junk'
            ? getValue(document.getElementById('junkContact')) || 'N/A'
            : getValue(document.getElementById('deliveryContact')) || 'N/A',
        name_or_contact: phone || email || 'N/A',
        photo_1: photoData[0] || 'N/A',
        photo_2: photoData[1] || 'N/A',
        photo_3: photoData[2] || 'N/A',
        photo_4: photoData[3] || 'N/A',
        photo_1_name: photoNames[0] || 'N/A',
        photo_2_name: photoNames[1] || 'N/A',
        photo_3_name: photoNames[2] || 'N/A',
        photo_4_name: photoNames[3] || 'N/A'
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
        const form = formType === 'junk' ? junkForm : deliveryForm;
        const photoInput = formType === 'junk'
            ? document.getElementById('junkPhoto')
            : document.getElementById('deliveryPhoto');
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
            let photos = { dataUrls: [], names: [] };
            try {
                photos = await getPhotoData(photoInput);
            } catch (error) {
                console.error('Photo read error:', error);
                window.alert('There was a problem reading your photos. Please try again.');
                return;
            }
            const params = buildEmailParams(formType, photos);
            const sent = await sendEmail(params, button);
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
