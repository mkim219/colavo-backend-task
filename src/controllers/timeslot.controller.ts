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