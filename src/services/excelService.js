import * as XLSX from 'xlsx';

/**
 * Excel 服务类
 */
class ExcelService {
  /**
   * 从指定路径读取 Excel 文件
   * @param {string} filePath - Excel 文件路径
   * @param {string} sheetName - 工作表名称（可选）
   * @returns {Promise<Array>} 解析后的数据
   */
  static async readExcelFile(filePath, sheetName = null) {
    try {
      const response = await fetch(filePath);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const blob = await response.blob();
      const arrayBuffer = await blob.arrayBuffer();
      
      // 指定文件类型为 xlsx
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });

      if (sheetName && workbook.Sheets[sheetName]) {
        // 转换为 JSON 时保持原始值
        return XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], {
          raw: true,
          defval: null
        });
      }

      // 如果未指定工作表名称，返回所有工作表的数据
      const result = {};
      workbook.SheetNames.forEach(sheet => {
        result[sheet] = XLSX.utils.sheet_to_json(workbook.Sheets[sheet], {
          raw: true,
          defval: null
        });
      });
      
      // 打印可用的工作表名称，用于调试
      console.log('可用的工作表:', workbook.SheetNames);
      
      return result;
    } catch (error) {
      console.error('读取Excel文件失败:', error);
      throw new Error('读取Excel文件失败');
    }
  }

  /**
   * 将数据导出为 Excel 文件
   * @param {Array} data - 要导出的数据
   * @param {string} fileName - 文件名
   * @param {string} sheetName - 工作表名称
   */
  static exportToExcel(data, fileName = 'export.xlsx', sheetName = 'Sheet1') {
    try {
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, sheetName);
      
      // 生成二进制文件并下载
      XLSX.writeFile(wb, fileName);
    } catch (error) {
      console.error('导出Excel文件失败:', error);
      throw new Error('导出Excel文件失败');
    }
  }

  /**
   * 将多个工作表数据导出为一个 Excel 文件
   * @param {Object} sheetsData - 工作表数据对象，格式：{ sheetName: data }
   * @param {string} fileName - 文件名
   */
  static exportMultipleSheets(sheetsData, fileName = 'export.xlsx') {
    try {
      const wb = XLSX.utils.book_new();
      
      Object.entries(sheetsData).forEach(([sheetName, data]) => {
        const ws = XLSX.utils.json_to_sheet(data);
        XLSX.utils.book_append_sheet(wb, ws, sheetName);
      });
      
      XLSX.writeFile(wb, fileName);
    } catch (error) {
      console.error('导出多工作表Excel文件失败:', error);
      throw new Error('导出多工作表Excel文件失败');
    }
  }

  /**
   * 将 Excel 文件转换为指定格式
   * @param {Array} data - Excel数据
   * @param {Object} formatConfig - 格式配置
   * @returns {Array} 格式化后的数据
   */
  static formatExcelData(data, formatConfig) {
    return data.map(row => {
      const formattedRow = {};
      Object.entries(formatConfig).forEach(([key, config]) => {
        if (row[key] !== undefined) {
          formattedRow[key] = this.formatValue(row[key], config);
        }
      });
      return formattedRow;
    });
  }

  /**
   * 格式化单个值
   * @param {any} value - 要格式化的值
   * @param {Object} config - 格式化配置
   * @returns {any} 格式化后的值
   */
  static formatValue(value, config) {
    if (!config || !config.type) return value;

    switch (config.type) {
      case 'number':
        return Number(value) || 0;
      case 'date':
        return new Date(value).toLocaleDateString();
      case 'currency':
        return `¥${Number(value).toFixed(2)}`;
      case 'percentage':
        return `${(Number(value) * 100).toFixed(2)}%`;
      default:
        return value;
    }
  }
}

export default ExcelService; 