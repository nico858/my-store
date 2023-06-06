import boom from '@hapi/boom';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';

import { config } from '../config/config.js';
import UserService from './user.service.js';
const service = new UserService();

export default class AuthService {

  async getUser(email, password) {
    const user = await service.findByEmail(email);
    if (!user) {
      throw boom.unauthorized();
    }
    const isMatch = await bcrypt.compare(password, user.userPassword);
    if(!isMatch) {
      throw boom.unauthorized(), false;
    }
    delete user.dataValues.userPassword;
    return user;
  }

  signToken(user) {
    const payload = {
      sub: user.clientId,
      role: user.role
    }
    const token = jwt.sign(payload, config.jwtSecret);
    return {
      user,
      token
    };
  }

  async sendRecovery(email) {
    const user = await service.findByEmail(email);
    if (!user) {
      throw boom.unauthorized();
    }
    const payload = { sub: user.clientId };
    const token = jwt.sign(payload, config.jwtSecret, {expiresIn: '15min'});
    const link = `http://alphafront.com/recovery?token=${token}`;
    await service.update(user.clientId, {recoveryToken: token});
    const mail = {
      from: config.smtpEmail,
      to: `${user.email}`,
      subject: "Recovery password email",
      html: `<b>Click in this link to recover your password ${link}</b>`,
    }
    const response = await this.sendMail(mail);
    return response;
  }

  async changePassword(token, newPassword) {
    try {
      const payload = jwt.verify(token, config.jwtSecret);
      const user = await service.findOne(payload.sub);
      if(user.recoveryToken !== token){
        throw boom.unauthorized();
      }
      const hash = await bcrypt.hash(newPassword, 10);
      await service.update(user.clientId, {recoveryToken: null, userPassword: hash});
      return { message: 'password changed '};
    } catch(error) {
      throw boom.unauthorized();
    }
  }

  async sendMail(infoMail) {
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      secure: true,
      port: 465,
      auth: {
          user: config.smtpEmail,
          pass: config.smtpPass
      },
    });
    await transporter.sendMail(infoMail);
    return { message: 'mail sent' };
  }
}