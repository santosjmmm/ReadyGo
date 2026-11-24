import { ConflictException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Reservation } from '../reservations/reservation.entity.js';
import { Payment } from './payment.entity.js';
import { PaymentsService } from './payments.service.js';

describe('PaymentsService simulated payments', () => {
  const paymentRepository = {
    create: vi.fn(),
    findOne: vi.fn(),
    save: vi.fn(),
  };
  const reservationRepository = {
    findOne: vi.fn(),
  };
  let service: PaymentsService;

  beforeEach(async () => {
    vi.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      providers: [
        PaymentsService,
        { provide: getRepositoryToken(Payment), useValue: paymentRepository },
        { provide: getRepositoryToken(Reservation), useValue: reservationRepository },
      ],
    }).compile();
    service = moduleRef.get(PaymentsService);
  });

  it('records a paid simulation using the reservation total and owner', async () => {
    const reservation = { id: 8, totalPrice: 12500 };
    reservationRepository.findOne.mockResolvedValue(reservation);
    paymentRepository.findOne.mockResolvedValue(null);
    paymentRepository.create.mockImplementation((payment) => payment);
    paymentRepository.save.mockImplementation(async (payment) => ({ id: 12, ...payment }));

    await service.simulateForCustomer(3, { reservationId: 8, paymentMethod: 'GCash' });

    expect(reservationRepository.findOne).toHaveBeenCalledWith({
      where: { id: 8, customer: { id: 3 } },
    });
    expect(paymentRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        amount: 12500,
        paymentMethod: 'GCash',
        status: 'paid',
        paidAt: expect.any(Date),
      }),
    );
    expect(paymentRepository.save).toHaveBeenCalledOnce();
  });

  it('does not create a second payment for a reservation', async () => {
    reservationRepository.findOne.mockResolvedValue({ id: 8, totalPrice: 12500 });
    paymentRepository.findOne.mockResolvedValue({ id: 12, status: 'pending' });

    await expect(
      service.simulateForCustomer(3, { reservationId: 8, paymentMethod: 'GCash' }),
    ).rejects.toThrow(ConflictException);
    expect(paymentRepository.save).not.toHaveBeenCalled();
  });

  it('returns an existing paid payment on retry', async () => {
    const existingPayment = { id: 12, status: 'paid' };
    reservationRepository.findOne.mockResolvedValue({ id: 8, totalPrice: 12500 });
    paymentRepository.findOne.mockResolvedValue(existingPayment);

    await expect(
      service.simulateForCustomer(3, { reservationId: 8, paymentMethod: 'GCash' }),
    ).resolves.toBe(existingPayment);
    expect(paymentRepository.save).not.toHaveBeenCalled();
  });
});
