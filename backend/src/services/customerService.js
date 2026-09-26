import * as customerRepository from '../repositories/customerRepository.js';

export function listCustomers() {
  return customerRepository.findAll();
}
