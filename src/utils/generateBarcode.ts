import bwipjs from 'bwip-js';

export const generateBarcode = async (text: string, type: string = 'code128'): Promise<string> => {
    const png = await bwipjs.toBuffer({
        bcid: type,
        text,
        scale: 3,
        height: 10,
        includetext: true,
        textxalign: 'center',
    });

    return `data:image/png;base64,${png.toString('base64')}`;
};
