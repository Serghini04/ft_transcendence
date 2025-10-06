import { MessageSquareMore } from 'lucide-react';

export default function Chat() {
    return (
        <div className="bg-amber-950 grid grid-cols-2 grid-rows-3 gap-4  h-screen w-screen">
            <div className="flex al">
                <MessageSquareMore />
                <h1>Messages</h1>
            </div>
            <p>Row 2, Column 1</p>
            <p>Row 2, Column 2</p>
            <p>Row 3, Column 1</p>
            <p>Row 3, Column 2</p>
        </ div>
    );
}