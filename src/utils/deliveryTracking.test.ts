import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  INITIAL_LIVE_DELIVERIES,
  computeCourierLivePosition,
  calculateRemainingMetrics,
  advanceDeliveryTick,
  updateDeliveryStage,
  createDeliveryFromPurchase,
  filterDeliveriesByQuery,
  generateCourierAutoReply,
} from './deliveryTracking';

describe('Online Delivery Tracking Engine (deliveryTracking)', () => {
  it('computes exact origin and destination positions at 0% and 100% progress', () => {
    const origin = { x: 44, y: 78 };
    const dest = { x: 46, y: 26 };

    const startPos = computeCourierLivePosition(origin, dest, 0);
    assert.equal(startPos.x, 44);
    assert.equal(startPos.y, 78);

    const endPos = computeCourierLivePosition(origin, dest, 100);
    assert.equal(endPos.x, 46);
    assert.equal(endPos.y, 26);

    const midPos = computeCourierLivePosition(origin, dest, 50);
    assert.ok(midPos.y < origin.y && midPos.y > dest.y);
    assert.equal(typeof midPos.angleDeg, 'number');
  });

  it('calculates remaining distance, ETA, and speed accurately across stages', () => {
    const inTransit = calculateRemainingMetrics(6.0, 50, 'in_transit');
    assert.equal(inTransit.remainingKm, 3.0);
    assert.ok(inTransit.etaMinutes >= 5);
    assert.equal(inTransit.speedKmh, 42);

    const delivered = calculateRemainingMetrics(6.0, 100, 'delivered');
    assert.equal(delivered.remainingKm, 0);
    assert.equal(delivered.etaMinutes, 0);
    assert.equal(delivered.speedKmh, 0);
  });

  it('advances delivery tick and transitions stages up to delivered', () => {
    let order = INITIAL_LIVE_DELIVERIES[0]; // 68% in_transit
    order = advanceDeliveryTick(order, 22, '11:32');
    assert.equal(order.progressPercent, 90);
    assert.equal(order.stage, 'arriving');
    assert.equal(order.stageTimestamps.arriving, '11:32');

    order = advanceDeliveryTick(order, 15, '11:35');
    assert.equal(order.progressPercent, 100);
    assert.equal(order.stage, 'delivered');
    assert.equal(order.distanceKm, 0);
    assert.equal(order.etaMinutes, 0);
  });

  it('updates delivery stage directly from admin dispatcher', () => {
    const order = INITIAL_LIVE_DELIVERIES[0];
    const updated = updateDeliveryStage(order, 'delivered', '12:00');
    assert.equal(updated.stage, 'delivered');
    assert.equal(updated.progressPercent, 100);
    assert.equal(updated.etaMinutes, 0);
    assert.equal(updated.stageTimestamps.delivered, '12:00');
  });

  it('creates a new live delivery order from a store purchase', () => {
    const newDel = createDeliveryFromPurchase({
      orderNumber: 'ORD-99100',
      customerId: 'usr_araik',
      customerName: 'Араик Петросян',
      address: 'Ереван, Кентрон, ул. Абовяна 10',
      totalOrderDram: 15000,
      itemsSummary: ['Хлеб × 1', 'Молоко × 2'],
      nowTimeStr: '12:15',
    });

    assert.equal(newDel.orderNumber, 'ORD-99100');
    assert.equal(newDel.feeDram, 0); // Free delivery >= 10,000 AMD
    assert.equal(newDel.stage, 'courier_assigned');
    assert.equal(newDel.verificationPin.length, 4);
    assert.ok(newDel.chatMessages.length >= 2);
  });

  it('filters deliveries by order number, customer name, or active status', () => {
    const activeOnly = filterDeliveriesByQuery(INITIAL_LIVE_DELIVERIES, '', 'active');
    assert.equal(activeOnly.length, 2);

    const byOrderNum = filterDeliveriesByQuery(INITIAL_LIVE_DELIVERIES, '88412', 'all');
    assert.equal(byOrderNum.length, 1);
    assert.equal(byOrderNum[0].orderNumber, 'ORD-88412');
  });

  it('generates contextual courier auto-replies in Russian and Armenian', () => {
    const order = INITIAL_LIVE_DELIVERIES[0];
    const doorReply = generateCourierAutoReply('Оставьте у двери пожалуйста', 'ru', order);
    assert.ok(doorReply.includes('бесконтактная доставка'));

    const callReplyHy = generateCourierAutoReply('Խնդրում եմ զանգեք', 'hy', order);
    assert.ok(callReplyHy.includes(order.customerPhone));
  });
});
