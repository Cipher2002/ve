import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { userId, sessionId, productCode } = await request.json();
    
    if (!userId || !sessionId) {
      return NextResponse.json(
        { error: 'Missing userId or sessionId' },
        { status: 400 }
      );
    }

    // First API call - Get credit costs
    const creditCostsResponse = await fetch('http://52.91.76.157/oneclick_service_109v.php/?VERSION=1.09&ENCODING=JSON&METHOD=GET_CREDIT_COSTS&PRODUCTNAME=oneclick');
    
    if (!creditCostsResponse.ok) {
      console.error('Failed to fetch credit costs');
      return NextResponse.json(
        { error: 'Failed to fetch credit costs' },
        { status: 500 }
      );
    }
    
    const creditCostsData = await creditCostsResponse.json();
    
    if (creditCostsData.RESULT !== 'SUCCESS' || !creditCostsData.RESPONSE?.EDIT_VIDEO_EXPORT) {
      console.error('Invalid credit costs response or missing EDIT_VIDEO_EXPORT');
      return NextResponse.json(
        { error: 'Invalid credit costs response' },
        { status: 500 }
      );
    }
    
    const targetProductCode = productCode || 'EDIT_VIDEO_EXPORT';
    const exportData = creditCostsData.RESPONSE[targetProductCode];
    
    if (!exportData) {
      console.error(`Product ${targetProductCode} not found in credit costs response`);
      return NextResponse.json(
        { error: `Product ${targetProductCode} not found` },
        { status: 500 }
      );
    }
    const productId = exportData.product_code;
    const credits = exportData.product_credits_cost;
    
    // Second API call - Use credits
    const useCreditUrl = `http://api.flickstree.com/oneclick_service_109v.php/?VERSION=1.09&ENCODING=JSON&METHOD=USE_CREDITS&PRODUCTNAME=oneclick&USERID=${userId}&SESSIONID=${sessionId}&product_id=${productId}&credits=${credits}&page_source=video_edit.php&auto_renew=&memo=&trans_id=&trans_type=&`;
    
    const useCreditResponse = await fetch(useCreditUrl);
    
    if (!useCreditResponse.ok) {
      console.error('Failed to deduct credits');
      return NextResponse.json(
        { error: 'Failed to deduct credits' },
        { status: 500 }
      );
    }
    
    const useCreditData = await useCreditResponse.json();
    
    if (useCreditData.RESULT === 'SUCCESS') {
      return NextResponse.json({
        success: true,
        data: {
          uniqId: useCreditData.RESPONSE.uniq_id,
          creditsDeducted: credits,
          productName: exportData.product_name
        }
      });
    } else {
      console.error('Credit deduction failed:', useCreditData);
      return NextResponse.json(
        { error: 'Credit deduction failed', details: useCreditData },
        { status: 500 }
      );
    }
    
  } catch (error) {
    console.error('Error in credit deduction process:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}