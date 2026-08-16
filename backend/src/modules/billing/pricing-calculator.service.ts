import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface PricingCalculationResult {
  durationMonths: number;
  monthlyPrice: number;
  grossAmount: number;
  discountPercentage: number;
  finalAmount: number;
  savingsAmount: number;
  currency: string;
}

@Injectable()
export class PricingCalculatorService {
  constructor(private prisma: PrismaService) {}

  async getPricingConfig() {
    const config = await (this.prisma as any).pricingConfig.findFirst({
      where: { isDefault: true },
    });

    if (!config) {
      return {
        baseMonthlyPrice: 6500,
        discount6Months: 0.10,
        discount12Months: 0.20,
        currency: 'XOF',
      };
    }

    return config;
  }

  async calculatePrice(durationMonths: number): Promise<PricingCalculationResult> {
    const config = await this.getPricingConfig();
    const baseMonthlyPrice = config.baseMonthlyPrice || 6500;
    const discount6Months = config.discount6Months ?? 0.10;
    const discount12Months = config.discount12Months ?? 0.20;

    let discountPercentage = 0;
    if (durationMonths >= 12) {
      discountPercentage = discount12Months;
    } else if (durationMonths >= 6) {
      discountPercentage = discount6Months;
    }

    const grossAmount = baseMonthlyPrice * durationMonths;
    const finalAmount = Math.round(grossAmount * (1 - discountPercentage));
    const savingsAmount = grossAmount - finalAmount;

    return {
      durationMonths,
      monthlyPrice: baseMonthlyPrice,
      grossAmount,
      discountPercentage: discountPercentage * 100,
      finalAmount,
      savingsAmount,
      currency: config.currency || 'XOF',
    };
  }

  async getAllPricingOptions() {
    const options1 = await this.calculatePrice(1);
    const options6 = await this.calculatePrice(6);
    const options12 = await this.calculatePrice(12);

    return {
      monthlyPrice: options1.monthlyPrice,
      currency: options1.currency,
      plans: [options1, options6, options12],
    };
  }
}
