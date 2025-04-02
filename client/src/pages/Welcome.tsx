import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function Welcome() {
  return (
    <div className="flex flex-col min-h-screen bg-white items-center justify-between px-4">
      {/* Status bar mockup for mobile appearance */}
      <div className="w-full max-w-sm pt-6 flex justify-between items-center">
        <span className="text-gray-600 text-sm">12:00</span>
        <div className="flex items-center space-x-1">
          <span className="material-icons text-gray-600 text-sm">network_wifi</span>
          <span className="material-icons text-gray-600 text-sm">signal_cellular_alt</span>
          <span className="material-icons text-gray-600 text-sm">battery_full</span>
        </div>
      </div>
      
      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center w-full max-w-sm py-8">
        {/* App logo */}
        <div className="w-24 h-24 flex items-center justify-center mb-6">
          <img src="https://i.ibb.co/0RgKY1dD/output.png" alt="Talkio Logo" className="w-full h-full object-contain" />
        </div>
        
        {/* Welcome text */}
        <h1 className="text-2xl font-bold mb-4 text-center">Welcome to Talkio</h1>
        
        {/* Tagline */}
        <p className="text-center text-gray-600 mb-10">
          Share with anyone, anywhere.
          <br />
          A home for all your conversations.
        </p>
        
        {/* App preview image */}
        <div className="relative w-64 h-80 bg-gray-50 rounded-3xl shadow-lg mb-10 overflow-hidden">
          <div className="h-12 w-full bg-primary rounded-t-xl flex items-center px-4">
            <div className="w-8 h-1 bg-white rounded-full"></div>
            <div className="flex-1"></div>
            <span className="material-icons text-white text-lg">search</span>
          </div>
          
          <div className="p-2 flex flex-col space-y-2">
            {/* Chat preview items */}
            {[1, 2, 3, 4, 5].map((item) => (
              <div key={item} className="flex items-center p-2 rounded-lg">
                <div className={`w-10 h-10 rounded-full flex-shrink-0 bg-${['pink', 'green', 'blue', 'yellow', 'purple'][item % 5]}-200 flex items-center justify-center`}>
                  {item === 1 && <span className="material-icons text-pink-500 text-sm">person</span>}
                  {item === 2 && <span className="material-icons text-green-500 text-sm">person</span>}
                  {item === 3 && <span className="material-icons text-blue-500 text-sm">person</span>}
                  {item === 4 && <span className="material-icons text-yellow-500 text-sm">image</span>}
                  {item === 5 && <span className="material-icons text-purple-500 text-sm">person</span>}
                </div>
                <div className="ml-3 flex-1">
                  <div className="h-2 bg-gray-200 rounded-full w-24"></div>
                  <div className="h-2 bg-gray-200 rounded-full w-16 mt-2"></div>
                </div>
                <div className="ml-2">
                  {item % 3 === 1 && <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                    <span className="text-white text-xs">1</span>
                  </div>}
                  {item % 3 !== 1 && <div className="w-4 h-1 bg-gray-200 rounded-full"></div>}
                </div>
              </div>
            ))}
            
            {/* Float action button */}
            <div className="absolute bottom-4 right-4 w-12 h-12 rounded-full bg-primary flex items-center justify-center">
              <span className="material-icons text-white">chat</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Button area */}
      <div className="w-full max-w-sm pb-20 space-y-6">
        <Link href="/login">
          <Button className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90 text-white text-lg font-medium">
            Log in
          </Button>
        </Link>
        
        <Link href="/register">
          <Button variant="outline" className="w-full h-12 rounded-xl border-primary text-primary hover:bg-primary/5 text-lg font-medium">
            Sign up
          </Button>
        </Link>
        
        {/* Bottom indicator */}
        <div className="flex justify-center mt-6">
          <div className="w-10 h-1 bg-gray-300 rounded-full"></div>
        </div>
      </div>
      
      {/* Footer */}
      <div className="w-full py-4 border-t flex justify-between items-center px-4 text-sm text-gray-500">
        <div className="flex items-center">
          <img src="https://i.ibb.co/0RgKY1dD/output.png" alt="Talkio Logo" className="w-6 h-6 mr-2" />
          <span className="font-medium">Talkio</span>
        </div>
        <div>
          Secure Messaging
        </div>
      </div>
    </div>
  );
}