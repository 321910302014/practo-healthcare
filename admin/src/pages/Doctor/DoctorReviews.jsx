import React, { useContext, useEffect, useState } from 'react'
import { DoctorContext } from '../../context/DoctorContext'
import { assets } from '../../assets/assets'
import axios from 'axios'
import { toast } from 'react-toastify'

const DoctorReviews = () => {
  const { dToken, backendUrl, profileData, getProfileData } = useContext(DoctorContext)
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterRating, setFilterRating] = useState('all')
  const [stats, setStats] = useState({
    average: 0,
    total: 0,
    distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
  })

  const getReviews = async () => {
    try {
      setLoading(true)
      const { data } = await axios.get(
        backendUrl + '/api/doctor/reviews',
        {
          headers: {
            Authorization: `Bearer ${dToken}`
          }
        }
      )
      if (data.success) {
        setReviews(data.reviews)
        calculateStats(data.reviews)
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      console.log(error)
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  const calculateStats = (reviewsData) => {
    if (reviewsData.length === 0) {
      setStats({ average: 0, total: 0, distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 } })
      return
    }

    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
    let total = 0

    reviewsData.forEach(review => {
      const rating = Math.round(review.rating)
      distribution[rating] = (distribution[rating] || 0) + 1
      total += review.rating
    })

    setStats({
      average: (total / reviewsData.length).toFixed(1),
      total: reviewsData.length,
      distribution
    })
  }

  useEffect(() => {
    if (dToken) {
      getReviews()
      getProfileData()
    }
  }, [dToken])

  const filteredReviews = reviews.filter(review => {
    if (filterRating === 'all') return true
    return Math.round(review.rating) === parseInt(filterRating)
  })

  const renderStars = (rating) => {
    return [...Array(5)].map((_, i) => (
      <span key={i} className={`text-lg ${i < rating ? 'text-yellow-400' : 'text-gray-300'}`}>
        ★
      </span>
    ))
  }

  const getProgressWidth = (count) => {
    if (stats.total === 0) return '0%'
    return `${(count / stats.total) * 100}%`
  }

  return (
    <div className='w-full max-w-6xl m-5'>
      <div className='mb-5'>
        <p className='text-lg font-medium'>Patient Reviews</p>
        <p className='text-sm text-gray-500'>See what your patients are saying</p>
      </div>

      {/* Stats Overview */}
      <div className='grid grid-cols-1 lg:grid-cols-3 gap-5 mb-5'>
        {/* Overall Rating */}
        <div className='bg-white p-6 rounded border col-span-1'>
          <div className='text-center'>
            <p className='text-5xl font-bold text-primary'>{stats.average}</p>
            <div className='flex justify-center my-2'>
              {renderStars(Math.round(stats.average))}
            </div>
            <p className='text-gray-500'>Based on {stats.total} reviews</p>
          </div>
        </div>

        {/* Rating Distribution */}
        <div className='bg-white p-6 rounded border col-span-2'>
          <p className='font-medium mb-4'>Rating Distribution</p>
          {[5, 4, 3, 2, 1].map(rating => (
            <div key={rating} className='flex items-center gap-3 mb-2'>
              <span className='w-8 text-sm'>{rating} ★</span>
              <div className='flex-1 bg-gray-200 rounded-full h-3'>
                <div
                  className='bg-yellow-400 h-3 rounded-full transition-all duration-500'
                  style={{ width: getProgressWidth(stats.distribution[rating]) }}
                ></div>
              </div>
              <span className='w-8 text-sm text-gray-500'>{stats.distribution[rating]}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Stats Cards */}
      <div className='flex flex-wrap gap-3 mb-5'>
        <div className='flex items-center gap-2 bg-white p-4 min-w-40 rounded border-2 border-gray-100'>
          <div className='w-10 h-10 bg-green-100 rounded-full flex items-center justify-center'>
            <span className='text-green-600 font-bold'>
              {reviews.filter(r => r.rating >= 4).length}
            </span>
          </div>
          <p className='text-gray-500 text-sm'>Positive Reviews</p>
        </div>
        <div className='flex items-center gap-2 bg-white p-4 min-w-40 rounded border-2 border-gray-100'>
          <div className='w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center'>
            <span className='text-yellow-600 font-bold'>
              {reviews.filter(r => r.rating === 3).length}
            </span>
          </div>
          <p className='text-gray-500 text-sm'>Neutral Reviews</p>
        </div>
        <div className='flex items-center gap-2 bg-white p-4 min-w-40 rounded border-2 border-gray-100'>
          <div className='w-10 h-10 bg-red-100 rounded-full flex items-center justify-center'>
            <span className='text-red-600 font-bold'>
              {reviews.filter(r => r.rating < 3).length}
            </span>
          </div>
          <p className='text-gray-500 text-sm'>Needs Attention</p>
        </div>
      </div>

      {/* Filter */}
      <div className='bg-white p-4 rounded border mb-5'>
        <div className='flex gap-2 items-center'>
          <span className='text-sm text-gray-500'>Filter by rating:</span>
          {['all', '5', '4', '3', '2', '1'].map(rating => (
            <button
              key={rating}
              onClick={() => setFilterRating(rating)}
              className={`px-3 py-1 rounded-full text-sm ${
                filterRating === rating
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {rating === 'all' ? 'All' : `${rating} ★`}
            </button>
          ))}
        </div>
      </div>

      {/* Reviews List */}
      <div className='bg-white border rounded'>
        <div className='p-4 border-b'>
          <p className='font-medium'>All Reviews ({filteredReviews.length})</p>
        </div>

        {loading ? (
          <div className='flex justify-center items-center py-10'>
            <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-primary'></div>
          </div>
        ) : filteredReviews.length === 0 ? (
          <div className='text-center py-10 text-gray-500'>
            No reviews found
          </div>
        ) : (
          <div className='divide-y'>
            {filteredReviews.map((review, index) => (
              <div key={review._id || index} className='p-4 hover:bg-gray-50'>
                <div className='flex items-start gap-4'>
                  <img
                    src={review.userData?.image || assets.patients_icon}
                    className='w-12 h-12 rounded-full object-cover border'
                    alt=""
                  />
                  <div className='flex-1'>
                    <div className='flex justify-between items-start'>
                      <div>
                        <p className='font-medium'>{review.userData?.name || 'Anonymous'}</p>
                        <div className='flex items-center gap-2'>
                          <div>{renderStars(review.rating)}</div>
                          <span className='text-sm text-gray-500'>
                            {review.createdAt ? new Date(review.createdAt).toLocaleDateString() : ''}
                          </span>
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs ${
                        review.rating >= 4
                          ? 'bg-green-100 text-green-600'
                          : review.rating === 3
                            ? 'bg-yellow-100 text-yellow-600'
                            : 'bg-red-100 text-red-600'
                      }`}>
                        {review.rating >= 4 ? 'Positive' : review.rating === 3 ? 'Neutral' : 'Critical'}
                      </span>
                    </div>
                    <p className='text-gray-600 mt-2'>{review.comment || 'No comment provided'}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default DoctorReviews
