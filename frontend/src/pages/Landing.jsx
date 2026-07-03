import { Link } from 'react-router-dom';
import { Bus, MapPin, Clock, Shield, Users, Zap } from 'lucide-react';
import Layout from '../components/Layout';

export default function Landing() {
  return (
    <Layout>
      <section className="text-center py-16">
        <div className="inline-flex items-center gap-2 bg-primary-50 text-primary-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
          <Zap className="w-4 h-4" />
          Real-Time Campus Mobility Platform
        </div>
        <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
          Campus Transportation,
          <span className="text-primary-600"> Reimagined</span>
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-10">
          Connect with e-rickshaw drivers across IIT Roorkee campus. Request rides, track in real-time,
          and travel smarter.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/register?role=passenger" className="btn-primary text-lg px-8 py-3">
            Request a Ride
          </Link>
          <Link to="/register?role=driver" className="btn-secondary text-lg px-8 py-3">
            Drive with Us
          </Link>
        </div>
      </section>

      <section className="grid md:grid-cols-3 gap-8 py-12">
        {[
          { icon: MapPin, title: 'Campus Locations', desc: '10+ predefined pickup points across IIT Roorkee campus' },
          { icon: Clock, title: 'Real-Time Updates', desc: 'Live ride tracking with WebSocket-powered instant notifications' },
          { icon: Shield, title: 'Verified Drivers', desc: 'All drivers are verified with license and vehicle information' },
        ].map(({ icon: Icon, title, desc }) => (
          <div key={title} className="card text-center">
            <div className="bg-primary-100 w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Icon className="w-6 h-6 text-primary-600" />
            </div>
            <h3 className="text-lg font-semibold mb-2">{title}</h3>
            <p className="text-gray-600">{desc}</p>
          </div>
        ))}
      </section>

      <section className="card bg-primary-600 text-white text-center py-12">
        <Users className="w-12 h-12 mx-auto mb-4 opacity-80" />
        <h2 className="text-2xl font-bold mb-4">Ready to get started?</h2>
        <p className="mb-6 opacity-90">Join hundreds of students and drivers on campus</p>
        <Link to="/login" className="inline-block bg-white text-primary-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
          Sign In
        </Link>
      </section>
    </Layout>
  );
}
