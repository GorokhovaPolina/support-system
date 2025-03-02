const API_URL = 'http://localhost:3000/requests';
async function loadRequests() {
    const res = await fetch(API_URL);
    const requests = await res.json();
    const container = document.getElementById('requests');
    container.innerHTML = '';
    requests.forEach(request => {
        const div = document.createElement('div');
        div.classList.add('request');
        div.innerHTML = `
            <p><strong>${request.topic}</strong></p>
            <p>${request.description}</p>
            <p>Статус: ${request.status}</p>
            <button onclick="setInWork(${request.id})">В работу</button>
            <button onclick="completeRequest(${request.id})">Завершить</button>
            <button onclick="cancelRequest(${request.id})">Отменить</button>
        `;
        container.appendChild(div);
    });
}
async function createRequest() {
    const topic = document.getElementById('topic').value;
    const description = document.getElementById('description').value;
    if (!topic || !description) {
        alert('Пожалуйста, заполните все поля');
        return;
    }
    const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ topic, description })
    });
    const data = await response.json();
    console.log('Ответ от сервера:', data);
    if (data.id) {
        alert('Обращение создано!');
        loadRequests();
    } else {
        alert('Ошибка при создании обращения');
    }
}
document.getElementById('requestForm').addEventListener('submit', function(event) {
    event.preventDefault();
    const topic = document.getElementById('topic').value;
    const description = document.getElementById('description').value;
    if (!topic || !description) {
        document.getElementById('error-message').style.display = 'block';
        document.getElementById('success-message').style.display = 'none';
        return;
    }
    fetch('/requests', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ topic, description })
    })
    .then(response => response.json())
    .then(data => {
        if (data.id) {
            document.getElementById('error-message').style.display = 'none';
            document.getElementById('success-message').style.display = 'block';
            setTimeout(() => {
                document.getElementById('success-message').style.display = 'none';
            }, 3000);
            updateRequests();
        }
    })
    .catch(error => {
        console.error('Error:', error);
    });
});
document.addEventListener('keydown', function(event) {
    if (event.key === 'Enter') {
        document.getElementById('requestForm').dispatchEvent(new Event('submit'));
    }
});
function toggleStatus(status) {
    const element = document.getElementById(`${status}-requests`);
    if (element.style.display === 'none' || element.style.display === '') {
        element.style.display = 'block';
    } else {
        element.style.display = 'none';
    }
}
function updateRequests() {
    fetch(API_URL)
        .then(response => response.json())
        .then(requests => {
            const statusGroups = {
                'new': [],
                'inWork': [],
                'completed': [],
                'canceled': []
            };
            requests.forEach(request => {
                statusGroups[request.status.toLowerCase()].push(request);
            });
            for (const [status, requestsList] of Object.entries(statusGroups)) {
                const statusElement = document.getElementById(`${status}-requests`);
                statusElement.innerHTML = '';
                const folderTitle = document.createElement('div');
                folderTitle.classList.add('folder-title');
                folderTitle.innerHTML = `<strong>${status.charAt(0).toUpperCase() + status.slice(1)}:</strong>`;
                folderTitle.onclick = function() {
                    toggleFolderVisibility(status);
                };
                const folderContent = document.createElement('div');
                folderContent.id = `${status}-folder-content`;
                folderContent.style.display = 'none';
                requestsList.forEach(request => {
                    const requestElement = document.createElement('div');
                    requestElement.classList.add('request-item');
                    requestElement.innerHTML = `
                        <p><strong>${request.topic}</strong></p>
                        <p>${request.description}</p>
                        <p>Статус: ${request.status}</p>
                        <button onclick="setInWork(${request.id})" ${request.status === 'В работе' ? 'disabled' : ''}>В работу</button>
                        <button onclick="completeRequest(${request.id})" ${request.status !== 'В работе' ? 'disabled' : ''}>Завершить</button>
                        <button onclick="cancelRequest(${request.id})" ${request.status === 'Отменено' ? 'disabled' : ''}>Отменить</button>
                    `;
                    folderContent.appendChild(requestElement);
                });
                statusElement.appendChild(folderTitle);
                statusElement.appendChild(folderContent);
            }
        });
}

async function setInWork(id) {
    await fetch(`${API_URL}/${id}/work`, { method: 'PATCH' });
    updateRequests();
}
async function completeRequest(id) {
    const resolution = prompt("Введите решение проблемы:");
    if (!resolution) return;
    await fetch(`${API_URL}/${id}/complete`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resolution })
    });
    updateRequests();
}
async function cancelRequest(id) {
    const reason = prompt("Введите причину отмены:");
    if (!reason) return;

    await fetch(`${API_URL}/${id}/cancel`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason })
    });
    updateRequests();
}
async function createRequest() {
    const topic = document.getElementById('topic').value;
    const description = document.getElementById('description').value;

    await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, description })
    });
    updateRequests();
}

function toggleFolderVisibility(status) {
    const folderContent = document.getElementById(`${status}-folder-content`);
    if (folderContent.style.display === 'none') {
        folderContent.style.display = 'block';
    } else {
        folderContent.style.display = 'none';
    }
}
document.addEventListener('DOMContentLoaded', () => {
    updateRequests();
});
window.onload = () => {
    updateRequests();
};