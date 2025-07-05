import express from 'express';
import cors from 'cors';
import { TimeslotController } from './controllers/timeslot.controller';

const app = express();
const PORT = process.env.PORT || 3000;

// 미들웨어 설정
app.use(cors());
app.use(express.json());

// 컨트롤러 인스턴스 생성
const timeslotController = new TimeslotController();

// 라우트 설정
app.post('/getTimeSlots', timeslotController.getTimeSlots);

// 헬스체크 엔드포인트
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

// 404 핸들러
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// 글로벌 에러 핸들러
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Global error handler:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message
  });
});

// 서버 시작 (테스트 환경이 아닐 때만)
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`🚀 서버가 포트 ${PORT}에서 실행 중입니다.`);
    console.log(`Health check: http://localhost:${PORT}/health`);
    console.log(`API endpoint: http://localhost:${PORT}/getTimeSlots`);
  });
}

export default app; 