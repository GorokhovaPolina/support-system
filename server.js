import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import { Sequelize, DataTypes, Op } from 'sequelize';
import path from 'path';

const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: 'database.sqlite'
});

const app = express();
app.use(express.json());
app.use(express.static('public'));

const Request = sequelize.define('Request', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    topic: { type: DataTypes.STRING, allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: false },
    status: { type: DataTypes.STRING, allowNull: false, defaultValue: 'Новое' },
    resolution: { type: DataTypes.TEXT, allowNull: true }
}, {
    timestamps: true
});

sequelize.sync();

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.post('/requests', async (req, res) => {
    const { topic, description } = req.body;
    if (!topic || !description) return res.status(400).json({ error: 'Тема и описание обязательны' });
    const request = await Request.create({ topic, description });
    res.status(201).json(request);
});

app.patch('/requests/:id/work', async (req, res) => {
    const request = await Request.findByPk(req.params.id);
    if (!request) return res.status(404).json({ error: 'Обращение не найдено' });
    if (request.status !== 'Новое') return res.status(400).json({ error: 'Обращение не в статусе "Новое"' });
    request.status = 'В работе';
    await request.save();
    res.json(request);
});

app.patch('/requests/:id/complete', async (req, res) => {
    const { resolution } = req.body;
    const request = await Request.findByPk(req.params.id);
    if (!request) return res.status(404).json({ error: 'Обращение не найдено' });
    if (request.status !== 'В работе') return res.status(400).json({ error: 'Обращение не в статусе "В работе"' });
    request.status = 'Завершено';
    request.resolution = resolution;
    await request.save();
    res.json(request);
});

app.patch('/requests/:id/cancel', async (req, res) => {
    const { reason } = req.body;
    const request = await Request.findByPk(req.params.id);
    if (!request) return res.status(404).json({ error: 'Обращение не найдено' });
    request.status = 'Отменено';
    request.resolution = reason;
    await request.save();
    res.json(request);
});

app.get('/requests', async (req, res) => {
    const { date, startDate, endDate } = req.query;
    let where = {};

    if (date) {
        where.createdAt = {
            [Op.eq]: new Date(date)
        };
    }

    if (startDate && endDate) {
        where.createdAt = {
            [Op.between]: [new Date(startDate), new Date(endDate)]
        };
    }

    const requests = await Request.findAll({ where });
    res.json(requests);
});

app.patch('/requests/cancel-all', async (req, res) => {
    await Request.update({ status: 'Отменено' }, { where: { status: 'В работе' } });
    res.json({ message: 'Все обращения в работе отменены' });
});

app.post('/requests', async (req, res) => {
    const { topic, description } = req.body;
    console.log('Создание обращения:', req.body);

    if (!topic || !description) {
        return res.status(400).json({ error: 'Тема и описание обязательны' });
    }

    try {
        const request = await Request.create({ topic, description });
        console.log('Обращение создано:', request);
        res.status(201).json(request);
    } catch (error) {
        console.error('Ошибка при создании обращения:', error);
        res.status(500).json({ error: 'Ошибка при создании обращения' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));