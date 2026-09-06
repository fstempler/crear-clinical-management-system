import { useCallback, useEffect, useState } from 'react'
import {
  getAdminMetrics,
  getAdminPatients,
  getProfessionalEvolutions,
  getProfessionalPatients,
} from '../services/dashboardService'

const initialSection = {
  data: null,
  isLoading: true,
  error: null,
}

const success = (data) => ({
  data,
  isLoading: false,
  error: null,
})

const failure = (error) => ({
  data: null,
  isLoading: false,
  error,
})

export function useDashboardData(user, professionalProfile) {
  const userId = user?.id
  const role = user?.role
  const professionalId = professionalProfile?.id

  const [patients, setPatients] = useState(initialSection)
  const [evolutions, setEvolutions] = useState(initialSection)
  const [metrics, setMetrics] = useState(initialSection)

  useEffect(() => {
    if (
      !userId ||
      (role === 'professional' && !professionalId)
    ) {
      return undefined
    }

    let active = true

    const loadPatients = async () => {
      try {
        if (role === 'admin') {
          const data = await getAdminPatients()

          if (active) {
            setPatients(success(data))
          }

          return
        }

        const data = await getProfessionalPatients(professionalId)

        if (active) {
          setPatients(success(data.patients))
          setMetrics(
            success({
              activePatients: data.activePatients,
            })
          )
        }
      } catch (error) {
        if (active) {
          setPatients(failure(error))

          if (role === 'professional') {
            setMetrics(failure(error))
          }
        }
      }
    }

    loadPatients()

    return () => {
      active = false
    }
  }, [professionalId, role, userId])

  useEffect(() => {
    if (role !== 'professional') {
      return undefined
    }

    let active = true

    getProfessionalEvolutions(userId)
      .then((data) => {
        if (active) {
          setEvolutions(success(data))
        }
      })
      .catch((error) => {
        if (active) {
          setEvolutions(failure(error))
        }
      })

    return () => {
      active = false
    }
  }, [role, userId])

  useEffect(() => {
    if (role !== 'admin') {
      return undefined
    }

    let active = true

    getAdminMetrics()
      .then((data) => {
        if (active) {
          setMetrics(success(data))
        }
      })
      .catch((error) => {
        if (active) {
          setMetrics(failure(error))
        }
      })

    return () => {
      active = false
    }
  }, [role])

  const retryPatients = useCallback(async () => {
    if (
      !userId ||
      (role === 'professional' && !professionalId)
    ) {
      return
    }

    setPatients((current) => ({
      ...current,
      isLoading: true,
      error: null,
    }))

    if (role === 'professional') {
      setMetrics((current) => ({
        ...current,
        isLoading: true,
        error: null,
      }))
    }

    try {
      if (role === 'admin') {
        const data = await getAdminPatients()
        setPatients(success(data))
        return
      }

      const data = await getProfessionalPatients(professionalId)

      setPatients(success(data.patients))
      setMetrics(
        success({
          activePatients: data.activePatients,
        })
      )
    } catch (error) {
      setPatients(failure(error))

      if (role === 'professional') {
        setMetrics(failure(error))
      }
    }
  }, [professionalId, role, userId])

  const retryEvolutions = useCallback(async () => {
    setEvolutions((current) => ({
      ...current,
      isLoading: true,
      error: null,
    }))

    try {
      const data = await getProfessionalEvolutions(userId)
      setEvolutions(success(data))
    } catch (error) {
      setEvolutions(failure(error))
    }
  }, [userId])

  const retryMetrics = useCallback(async () => {
    setMetrics((current) => ({
      ...current,
      isLoading: true,
      error: null,
    }))

    try {
      const data = await getAdminMetrics()
      setMetrics(success(data))
    } catch (error) {
      setMetrics(failure(error))
    }
  }, [])

  const metricsRetry =
    role === 'professional'
      ? retryPatients
      : retryMetrics

  return {
    patients: {
      ...patients,
      retry: retryPatients,
    },
    evolutions: {
      ...evolutions,
      retry: retryEvolutions,
    },
    metrics: {
      ...metrics,
      retry: metricsRetry,
    },
  }
}