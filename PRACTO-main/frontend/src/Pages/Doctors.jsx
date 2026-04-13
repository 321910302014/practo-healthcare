import axios from 'axios';
import { useContext, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { AppContext } from '../context/AppContext';
import { toast } from 'react-toastify';

// Backend URLs
const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';

const Doctors = () => {
  const { speciality } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, token, getDoctorsData } = useContext(AppContext);
  const userInsurance = user?.insuranceProvider || '';

  const [doctors, setDoctors] = useState([]);
  const [filterDoc, setFilterDoc] = useState([]);
  const [filterInsurance, setFilterInsurance] = useState('');
  const [showFilter, setShowFilter] = useState(false);

  // AI Matchmaking results from Navigation State (passed from SymptomChecker.jsx)
  const [aiMatches, setAiMatches] = useState([]);
  const [aiFindings, setAiFindings] = useState(null);

  useEffect(() => {
    if (location.state?.suggestedDoctors) {
      setAiMatches(location.state.suggestedDoctors);
      setAiFindings(location.state.aiResults);
      // Optional: scroll to top to see AI results
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [location.state]);

  // Fetch doctors from backend
  const fetchDoctors = async (insurance) => {
    try {
      let url = `${backendUrl}/api/doctor/list`;
      if (insurance) url += `?insuranceProvider=${encodeURIComponent(insurance)}`;
      const { data } = await axios.get(url);
      setDoctors(data.doctors || []);
    } catch (error) {
      console.error("Error fetching doctors:", error);
    }
  };

  // Global refresh function
  useEffect(() => {
    window.refreshDoctors = () => fetchDoctors(filterInsurance);
    return () => { delete window.refreshDoctors; };
  }, [filterInsurance]);

  // Filter doctors by speciality
  const applyFilter = () => {
    if (speciality) {
      const specialityLower = speciality.toLowerCase();
      const filtered = doctors.filter(doc => {
        const specs = doc.specialization || doc.speciality || [];
        if (Array.isArray(specs)) return specs.some(spec => spec.toLowerCase() === specialityLower);
        if (typeof specs === 'string') return specs.split(',').map(s => s.trim().toLowerCase()).includes(specialityLower);
        return false;
      });
      setFilterDoc(filtered);
    } else {
      setFilterDoc(doctors);
    }
  };

  useEffect(() => { fetchDoctors(filterInsurance); }, [filterInsurance]);
  useEffect(() => { applyFilter(); }, [doctors, speciality]);

  // Submit a rating
  const handleRate = async (doctorId, newRating) => {
    if (!token) {
      toast.warn("Please log in to rate doctors");
      return navigate('/login');
    }

    try {
      const { data } = await axios.post(
        `${backendUrl}/api/reviews/add`,
        { doctorId, rating: newRating },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (data.success) {
        toast.success("Thank you for your rating!");
        getDoctorsData(); // Refresh global doctors data
        fetchDoctors(filterInsurance); // Refresh local state
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error("Rating error:", error);
      toast.error(error.response?.data?.message || "Failed to submit rating");
    }
  };

  // Render stars
  const renderStars = (rating, reviewsCount, doctorId) => (
    <div className="flex flex-col gap-1 mt-2">
      <div className="flex items-center gap-1 group/stars">
        {[1, 2, 3, 4, 5].map((star) => (
          <span
            key={star}
            onClick={(e) => { e.stopPropagation(); handleRate(doctorId, star); }}
            className={`text-lg cursor-pointer transition-all duration-200 hover:scale-125 ${star <= (rating || 0)
              ? "text-yellow-400 fill-yellow-400"
              : "text-gray-300 hover:text-yellow-200"
              }`}
            title={`Rate ${star} stars`}
          >
            ★
          </span>
        ))}
        <span className="ml-2 text-xs font-bold text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full border border-gray-100">
          {rating ? rating.toFixed(1) : "0.0"}
        </span>
      </div>
      <p className="text-[10px] font-medium text-gray-500 uppercase tracking-tighter">
        {reviewsCount || 0} Professional Review{(reviewsCount !== 1) ? 's' : ''}
      </p>
    </div>
  );

  return (
    <div className="pb-20">
      {/* 🤖 AI Recommended Section (Highly Visible) */}
      {aiMatches.length > 0 && (
        <div className="mb-12 p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-3xl border border-blue-100 shadow-sm animate-in fade-in slide-in-from-top duration-700">
          <div className="flex items-center gap-3 mb-4">
            <span className="px-3 py-1 bg-primary text-white text-xs font-bold rounded-full tracking-wider">AI RECOMMENDATION</span>
            <h2 className="text-2xl font-bold text-gray-800">Best Matching Specialists</h2>
          </div>

          {aiFindings && (
            <div className="mb-6 p-4 bg-white/60 backdrop-blur-sm rounded-xl border border-blue-50">
              <p className="text-sm text-gray-600 italic">"Based on your symptoms: {location.state.originalSymptoms}"</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {aiFindings.conditions?.slice(0, 2).map((c, i) => (
                  <span key={i} className="text-xs font-medium text-blue-700 bg-blue-100/50 px-2 py-1 rounded-md">Condition Study: {c}</span>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {aiMatches.map(doc => (
              <div
                key={doc._id}
                className="group relative bg-white p-5 rounded-2xl border border-blue-100 hover:border-primary hover:shadow-xl transition-all duration-300 overflow-hidden"
              >
                <div className="flex items-start gap-4">
                  <img className="w-20 h-20 rounded-xl object-cover border-2 border-gray-50 group-hover:border-primary/20 transition-colors" src={doc.image} alt={doc.name} />
                  <div className="flex-1">
                    <p className="font-bold text-gray-900 group-hover:text-primary transition-colors">{doc.name}</p>
                    <p className="text-xs font-medium text-primary uppercase tracking-tight">{doc.speciality}</p>
                    {renderStars(doc.rating, doc.reviewsCount, doc._id)}
                  </div>
                </div>

                <div className="mt-4 flex flex-col gap-2">
                  <div className="flex items-center gap-2 text-[10px] text-gray-500">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                    <span>Highly Compatible with your symptoms</span>
                  </div>
                  <button
                    onClick={() => navigate(`/appointment/${doc._id}`)}
                    className="w-full py-2 bg-primary text-white text-sm font-semibold rounded-xl hover:opacity-90 active:scale-95 transition-all shadow-md shadow-primary/20"
                  >
                    Book Priority Appointment
                  </button>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={() => { setAiMatches([]); setAiFindings(null); }}
            className="mt-6 text-xs text-gray-400 hover:text-gray-600 transition-colors underline underline-offset-4"
          >
            Clear AI Recommendations
          </button>
        </div>
      )}

      {/* Standard Browse Section */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Browse Specialists</h1>
          <p className='text-gray-500 mt-1'>Filter doctors by speciality or insurance provider.</p>
        </div>

        <select
          className="p-3 border-2 border-gray-100 rounded-xl text-sm font-medium focus:border-primary focus:outline-none bg-white transition-all cursor-pointer"
          value={filterInsurance}
          onChange={(e) => setFilterInsurance(e.target.value)}
        >
          <option value="">All Insurances</option>
          <option value="Aetna">Aetna</option>
          <option value="Blue Cross">Blue Cross</option>
          <option value="United">United</option>
          <option value="Cigna">Cigna</option>
          <option value="Humana">Humana</option>
          <option value="Medicare">Medicare</option>
          <option value="Medicaid">Medicaid</option>
          <option value="Kaiser Permanente">Kaiser Permanente</option>
          <option value="UnitedHealthcare">UnitedHealthcare</option>
        </select>
      </div>

      <div className='flex flex-col items-start gap-8 mt-5 sm:flex-row'>
        <button
          onClick={() => setShowFilter(!showFilter)}
          className={`py-2 px-6 border-2 rounded-xl text-sm font-semibold transition-all sm:hidden ${showFilter ? 'bg-primary text-white border-primary' : 'bg-white text-gray-600 border-gray-100'}`}>
          {showFilter ? 'Close Filters' : 'Speciality Filters'}
        </button>

        <div className={`flex-col gap-3 text-sm text-gray-600 ${showFilter ? 'flex' : 'hidden sm:flex'} min-w-[200px]`}>
          {["General physician", "Gynecologist", "Dermatologist", "Pediatricians", "Neurologist", "Gastroenterologist", "Cardiologist", "Pulmonologist"].map((spec, idx) => (
            <p
              key={idx}
              onClick={() => speciality?.toLowerCase() === spec.toLowerCase() ? navigate('/doctors') : navigate(`/doctors/${spec}`)}
              className={`w-full sm:w-auto pl-4 py-3 pr-12 border-2 rounded-xl transition-all cursor-pointer font-medium ${speciality?.toLowerCase() === spec.toLowerCase() ? 'bg-primary/5 text-primary border-primary/20' : 'bg-white border-gray-50 hover:border-gray-200 hover:bg-gray-50'}`}>
              {spec}
            </p>
          ))}
        </div>

        <div className='grid w-full gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'>
          {filterDoc.length > 0 ? filterDoc.map(doc => (
            <div
              key={doc._id}
              className='group flex flex-col bg-white border border-gray-100 rounded-3xl overflow-hidden cursor-pointer hover:shadow-2xl hover:-translate-y-2 transition-all duration-500'
              onClick={() => { navigate(`/appointment/${doc._id}`); scrollTo(0, 0); }}
            >
              <div className="relative">
                <img className='bg-indigo-50 w-full h-64 object-cover' src={doc.image} alt={doc.name} />
                <div className={`absolute top-4 left-4 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest backdrop-blur-md ${doc.available ? 'bg-green-500/10 text-green-600 border border-green-200' : 'bg-gray-500/10 text-gray-600 border border-gray-200'}`}>
                  {doc.available ? '● Available' : '● Away'}
                </div>
              </div>

              <div className='p-6 flex-1 flex flex-col'>
                <p className='text-gray-900 text-xl font-bold group-hover:text-primary transition-colors'>{doc.name}</p>
                <p className='text-primary text-xs font-bold uppercase tracking-wider mb-2'>{doc.speciality}</p>

                {renderStars(doc.rating, doc.reviewsCount, doc._id)}

                {userInsurance && doc.acceptedInsurances?.some(i => i.toLowerCase() === userInsurance.toLowerCase()) && (
                  <div className="mt-3 flex items-center gap-1.5 text-[10px] font-bold text-green-600 bg-green-50 px-2.5 py-1.5 rounded-lg border border-green-100 w-fit">
                    🛡️ ACCEPTS YOUR INSURANCE
                  </div>
                )}

                <div className='flex flex-col gap-3 mt-6 pt-6 border-t border-gray-50'>
                  <button className="w-full py-2.5 bg-gray-900 text-white text-sm font-bold rounded-xl hover:bg-gray-800 transition-all shadow-lg shadow-gray-200">
                    Book Appointment
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); const appointmentId = Date.now().toString(); navigate(`/video-call/${appointmentId}`); }}
                    className="w-full py-2.5 border-2 border-primary/20 text-primary text-sm font-bold rounded-xl hover:bg-primary/5 transition-all"
                  >
                    Video Consultation
                  </button>
                </div>
              </div>
            </div>
          )) : (
            <div className="col-span-full py-20 text-center">
              <div className="text-5xl mb-4">🩺</div>
              <p className="text-gray-400 font-medium">No doctors found in this category.</p>
              <button onClick={() => navigate('/doctors')} className="mt-4 text-primary font-bold hover:underline">View All Doctors</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Doctors;
