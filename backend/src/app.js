require('dotenv').config();
const express = require('express');
const cors = require('cors');
const exchangeRoutes = require('./routes/exchangeRoutes');
const loanRoutes = require('./routes/loanRoutes');
const { initDatabase } = require('./db/database');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

initDatabase();

app.use('/api', exchangeRoutes);
app.use('/api', loanRoutes);

app.get('/', (req, res) => {
  res.json({ message: '대출 계산기 API 서버가 실행 중입니다.' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: '서버 오류가 발생했습니다.' });
});

app.listen(PORT, () => {
  console.log(`서버가 포트 ${PORT}에서 실행 중입니다.`);
});

module.exports = app;
