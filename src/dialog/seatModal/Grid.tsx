import React, { useState, useRef, useEffect } from 'react';

const fruits = [
    '苹果', '香蕉', '橘子', '西瓜', '草莓', '葡萄', '柠檬', '菠萝', '梨', '桃子',
    '柚子', '柑桔', '百香果', '猕猴桃', '梅子', '桂圆', '荔枝', '柳丁', '柿子',
    '枇杷', '桔子', '樱桃', '柚子', '柠檬', '草莓'
];

interface Position {
    x: number;
    y: number;
}

const Grid: React.FC = () => {
    // 状态管理
    const [startPos, setStartPos] = useState<Position | null>(null); // 记录拖拽起点位置
    const [endPos, setEndPos] = useState<Position | null>(null); // 记录拖拽终点位置
    const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set()); // 存储选中的元素索引
    const [hoveredIndices, setHoveredIndices] = useState<Set<number>>(new Set()); // 存储当前拖拽过程中框选的元素索引
    const gridRef = useRef<HTMLDivElement>(null); // 引用网格容器

    // 处理鼠标按下事件
    const handleMouseDown = (e: React.MouseEvent) => {
        const rect = gridRef.current!.getBoundingClientRect();
        const startX = e.clientX - rect.left;
        const startY = e.clientY - rect.top;
        setStartPos({ x: startX, y: startY }); // 设置起点
        setEndPos({ x: startX, y: startY }); // 设置终点为起点
    };

    // 处理鼠标移动事件
    const handleMouseMove = (e: React.MouseEvent) => {
        if (startPos) {
            const rect = gridRef.current!.getBoundingClientRect();
            const endX = e.clientX - rect.left;
            const endY = e.clientY - rect.top;
            setEndPos({ x: endX, y: endY }); // 更新终点

            // 计算并更新当前框选范围内的元素索引
            const hovered = new Set<number>();
            const x1 = Math.min(startPos.x, endX);
            const x2 = Math.max(startPos.x, endX);
            const y1 = Math.min(startPos.y, endY);
            const y2 = Math.max(startPos.y, endY);

            const items = gridRef.current!.children;
            for (let i = 0; i < items.length; i++) {
                const item = items[i] as HTMLDivElement;
                const rect = item.getBoundingClientRect();
                const itemX = rect.left - gridRef.current!.getBoundingClientRect().left;
                const itemY = rect.top - gridRef.current!.getBoundingClientRect().top;

                if (
                    itemX + rect.width >= x1 &&
                    itemX <= x2 &&
                    itemY + rect.height >= y1 &&
                    itemY <= y2
                ) {
                    hovered.add(i);
                }
            }
            setHoveredIndices(hovered); // 更新临时选中的元素索引
        }
    };

    // 处理鼠标释放事件
    const handleMouseUp = () => {
        if (startPos && endPos) {
            const selected = new Set<number>(selectedIndices);
            const x1 = Math.min(startPos.x, endPos.x);
            const x2 = Math.max(startPos.x, endPos.x);
            const y1 = Math.min(startPos.y, endPos.y);
            const y2 = Math.max(startPos.y, endPos.y);

            const items = gridRef.current!.children;
            for (let i = 0; i < items.length; i++) {
                const item = items[i] as HTMLDivElement;
                const rect = item.getBoundingClientRect();
                const itemX = rect.left - gridRef.current!.getBoundingClientRect().left;
                const itemY = rect.top - gridRef.current!.getBoundingClientRect().top;

                if (
                    itemX + rect.width >= x1 &&
                    itemX <= x2 &&
                    itemY + rect.height >= y1 &&
                    itemY <= y2
                ) {
                    if (selected.has(i)) {
                        selected.delete(i); // 如果已选中则取消选中（反选）
                    } else {
                        selected.add(i); // 否则添加到选中集合
                    }
                }
            }
            setSelectedIndices(selected); // 更新选中的元素索引
        }
        setStartPos(null); // 重置起点
        setEndPos(null); // 重置终点
        setHoveredIndices(new Set()); // 重置临时选中的元素索引
    };

    // 添加全局鼠标释放事件监听器，以防用户释放鼠标时不在网格区域内
    useEffect(() => {
        const handleMouseUpGlobal = () => handleMouseUp();
        window.addEventListener('mouseup', handleMouseUpGlobal);
        return () => window.removeEventListener('mouseup', handleMouseUpGlobal);
    }, [startPos, endPos]);

    return (
        <div
            ref={gridRef}
            style={{
                position: 'relative',
                display: 'grid',
                gridTemplateColumns: 'repeat(5, 80px)',
                gridGap: '10px',
                border: '1px solid gray',
                borderRadius: '7px',
                justifyContent: 'center',
                boxSizing: 'border-box',
                padding: '50px 0',
                userSelect: 'none',
            }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
        >
            {fruits.map((fruit, index) => (
                <div
                    key={index}
                    style={{
                        margin: '0 auto',
                        backgroundColor: selectedIndices.has(index)
                            ? 'lightblue' // 选中时的背景颜色
                            : hoveredIndices.has(index)
                            ? 'lightgreen' // 临时选中时的背景颜色
                            : 'white', // 默认背景颜色
                        padding: '10px',
                        textAlign: 'center',
                        borderRadius: '5px',
                        border: hoveredIndices.has(index)
                            ? '2px dashed green' // 临时选中时的边框样式
                            : '1px solid gray', // 默认边框样式
                        boxShadow: '0 0 2px gray',
                        cursor: 'pointer',
                    }}
                >
                    {fruit}
                </div>
            ))}
            {startPos && endPos && (
                <div
                    style={{
                        position: 'absolute',
                        left: Math.min(startPos.x, endPos.x),
                        top: Math.min(startPos.y, endPos.y),
                        width: Math.abs(endPos.x - startPos.x),
                        height: Math.abs(endPos.y - startPos.y),
                        border: '2px dashed black',
                        pointerEvents: 'none',
                    }}
                />
            )}
        </div>
    );
};

export default Grid;
