import { Request, Response } from 'express';
import { RequestBody, ResponseBody } from '../types/interfaces';
import { validateRequestBody } from '../utils/validation.util';
import { TimeslotService } from '../services/timeslot.service';

export class TimeslotController {
  private timeslotService: TimeslotService;

  constructor() {
    this.timeslotService = new TimeslotService();
  }

  /**
   * POST /getTimeSlots 엔드포인트 핸들러
   */
  public getTimeSlots = async (req: Request, res: Response): Promise<void> => {
    try {
      // 요청 바디 검증
      const validation = validateRequestBody(req.body);
      if (!validation.isValid) {
        res.status(400).json({
          error: 'Invalid request body',
          details: validation.errors
        });
        return;
      }

      const requestBody: RequestBody = req.body;

      // 타임슬롯 생성
      const result: ResponseBody = this.timeslotService.generateTimeSlots(requestBody);

      res.status(200).json(result);
    } catch (error) {
      console.error('Error in getTimeSlots:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };
}

/*
// DI를 적용한 버전:
import { Request, Response } from 'express';
import { RequestBody, ResponseBody } from '../types/interfaces';
import { validateRequestBody } from '../utils/validation.util';
import { TimeslotService } from '../services/timeslot.service';

export class TimeslotController {
  constructor(private readonly timeslotService: TimeslotService) {}

  public getTimeSlots = async (req: Request, res: Response): Promise<void> => {
    try {
      // 요청 바디 검증
      const validation = validateRequestBody(req.body);
      if (!validation.isValid) {
        res.status(400).json({
          error: 'Invalid request body',
          details: validation.errors
        });
        return;
      }

      const requestBody: RequestBody = req.body;

      // 타임슬롯 생성
      const result: ResponseBody = this.timeslotService.generateTimeSlots(requestBody);

      res.status(200).json(result);
    } catch (error) {
      console.error('Error in getTimeSlots:', error);
      res.status(500).json({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };
}

// 사용 예시:
// const timeslotService = new TimeslotService();
// const timeslotController = new TimeslotController(timeslotService);
*/ 

// 테스트가 더 쉬워집니다 (목(mock) 서비스를 주입할 수 있음)
// 의존성을 외부에서 관리할 수 있어 유연성이 증가합니다
// 단일 책임 원칙을 더 잘 준수할 수 있습니다
// 코드의 결합도가 낮아지고 재사용성이 높아집니다